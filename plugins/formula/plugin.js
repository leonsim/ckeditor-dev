/**
 * Kity Formula Plugin
 */

( function () {

    var pluginName = 'formula',
        commandName = 'insertformula';

    CKEDITOR.plugins.add( pluginName, {
        requires: 'widget,dialog',
        icons: 'formula', // %REMOVE_LINE_CORE%
        hidpi: true, // %REMOVE_LINE_CORE%

        init: function( editor ) {
            var cls = editor.config.formulaClass || pluginName;

            editor.widgets.add(pluginName, {
                inline: true,
                dialog: pluginName,
                button: '公式',
                mask: true,
                allowedContent: 'span(!' + cls + ')',

                styleToAllowedContentRules: function(style) {
					var classes = style.getClassesArray();
					if ( !classes )
						return null;
					classes.push( '!' + cls );

					return 'span(' + classes.join( ',' ) + ')';
                },
				template: '<span class="' + cls + '" style="display:inline-block;margin:1px 8px;" data-cke-survive=1></span>',

                parts: {
                    span: 'span'
                },

                defaults: {
                    math: '\\(\\placeholder\\)'
                },

                init: function() {
                    var iframe = this.parts.span.getChild(0);
                    if (!iframe || iframe.type != CKEDITOR.NODE_ELEMENT || !iframe.is('iframe')) {
                        iframe = new CKEDITOR.dom.element('iframe');
                        iframe.setAttributes({
                            style: 'border:0;width:0;height:0',
                            scrolling: 'no',
                            frameborder: 0,
                            allowTransparency: true,
                            src: CKEDITOR.plugins.formula.fixSrc
                        });
                        this.parts.span.append(iframe);
                    }

                    this.once('ready', function() {
                        if (CKEDITOR.env.ie) {
                            iframe.setAttribute('src', CKEDITOR.plugins.formula.fixSrc);
                        }
                        this.frameWrapper = new CKEDITOR.plugins.formula.frameWrapper(iframe, editor);
                        this.frameWrapper.setValue(this.data.math);
                    });
                },

                data: function() {
                    if (this.frameWrapper) {
                        this.frameWrapper.setValue(this.data.math);
                    }
                },

                upcast: function(el, data) {
                    if (!(el.name == 'span' && el.hasClass(cls)))
                        return;
                    if (el.children.length > 1 || el.children[0].type != CKEDITOR.NODE_TEXT)
                        return;

                    data.math = CKEDITOR.tools.htmlDecode(el.children[0].value);

                    var attrs = el.attributes;

                    if (attrs.style)
                        attrs.style += ';display:inline-block';
                    else
                        attrs.style = 'display:inline-block';
                    attrs.style += ';margin:1px 8px';
                    attrs['data-cke-survive'] = 1;
                    
                    el.children[0].remove();
                    return el;
                },

                downcast: function(el) {
                    el.children[0].replaceWith(new CKEDITOR.htmlParser.text(CKEDITOR.tools.htmlEncode(this.data.math)));

                    var attrs = el.attributes;
                    attrs.style = attrs.style.replace(/display:\s?inline-block;?\s?/, '');
                    if (attrs.style == '')
                        delete attrs.style;
                    return el;
                }
            });

            CKEDITOR.dialog.add( pluginName, this.path + 'dialogs/formula.js' );

            editor.on('contentPreview', function(evt) {
                evt.data.dataValue = evt.data.dataValue.replace(/<\/head>/,
                    '<script src="' + CKEDITOR.getUrl(editor.config.mathJaxLib) + '"><\/script><\/head>');
            });

            editor.on('paste', function(evt) {
                var regex = new RegExp('<span[^>]*?' + cls + '.*?<\/span>', 'ig');
                evt.data.dataValue = evt.data.dataValue.replace(regex, function(match) {
                    return math.replace(/(<iframe.*?\/iframe>)/i, '');
                });
            });
        }
    });

    CKEDITOR.plugins.formula = {};

    CKEDITOR.plugins.formula.fixSrc = 
        CKEDITOR.env.gecko ? 'javascript: true' :
        CKEDITOR.env.ie ? 'javascript:' + 
						'void((function(){' + encodeURIComponent(
							'document.open();' +
							'(' + CKEDITOR.tools.fixDomain + ')();' +
							'document.close();'
						) + '})())' :
		// In Chrome src must be undefined to emit load event.
						'javascript:void(0)';


	CKEDITOR.plugins.formula.loadingIcon = CKEDITOR.plugins.get( 'formula' ).path + 'page/assets/images/loader.gif';

    CKEDITOR.plugins.formula.copyStyles = function(from, to) {
        var stylesToCopy = ['color', 'font-family', 'font-style', 'font-weight', 'font-variant', 'font-size'];
        for (var i = 0; i < stylesToCopy.length; ++i) {
            var key = stylesToCopy[i],
                val = from.getComputedStyle(key);
            if (val)
                to.setStyle(key, val);
        }
    };

	CKEDITOR.plugins.formula.trim = function( value ) {
		var begin = value.indexOf( '\\(' ) + 2,
			end = value.lastIndexOf( '\\)' );

		return value.substring( begin, end );
	};

    CKEDITOR.plugins.formula.frameWrapper = function( iFrame, editor ) {

        var buffer, preview, value, newValue,
        doc = iFrame.getFrameDocument(),

        // Is MathJax loaded and ready to work.
        isInit = false,

        // Is MathJax parsing Tex.
        isRunning = false,

        // Function called when MathJax is loaded.
        loadedHandler = CKEDITOR.tools.addFunction( function() {
            preview = doc.getById( 'preview' );
            buffer = doc.getById( 'buffer' );
            isInit = true;

            if ( newValue )
                update();

        } ),

        // Function called when MathJax finish his job.
        updateDoneHandler = CKEDITOR.tools.addFunction( function() {
            CKEDITOR.plugins.formula.copyStyles( iFrame, preview );

            preview.setHtml( buffer.getHtml() );

            editor.fire( 'lockSnapshot' );

            iFrame.setStyles( {
                height: 0,
                width: 0
            } );

            // Set iFrame dimensions.
            var height = Math.max( doc.$.body.offsetHeight, doc.$.documentElement.offsetHeight ),
            width = Math.max( preview.$.offsetWidth, doc.$.body.scrollWidth );

            iFrame.setStyles( {
                height: height + 'px',
                width: width + 'px'
            } );

            editor.fire( 'unlockSnapshot' );

            // If value changed in the meantime update it again.
            if ( value != newValue )
                update();
            else
                isRunning = false;
        } );

        iFrame.on( 'load', load );

        load();

        function load() {
            doc = iFrame.getFrameDocument();

            if ( doc.getById( 'preview' ) )
                return;

            // Because of IE9 bug in a src attribute can not be javascript
            // when you undo (#10930). If you have iFrame with javascript in src
            // and call insertBefore on such element then IE9 will see crash.
            if ( CKEDITOR.env.ie )
                iFrame.removeAttribute( 'src' );

            doc.write( '<!DOCTYPE html>' +
                      '<html>' +
                      '<head>' +
                      '<meta charset="utf-8">' +
                      '<script type="text/x-mathjax-config">' +

                      // MathJax configuration, disable messages.
                      'MathJax.Hub.Config( {' +
                      'showMathMenu: false,' +
                      'messageStyle: "none"' +
                      '} );' +

                      // Get main CKEDITOR form parent.
                      'function getCKE() {' +
                      'if ( typeof window.parent.CKEDITOR == \'object\' ) {' +
                      'return window.parent.CKEDITOR;' +
                      '} else {' +
                      'return window.parent.parent.CKEDITOR;' +
                      '}' +
                      '}' +

                      // Run MathJax.Hub with its actual parser and call callback function after that.
                      // Because MathJax.Hub is asynchronous create MathJax.Hub.Queue to wait with callback.
                      'function update() {' +
                      'MathJax.Hub.Queue(' +
                      '[ \'Typeset\', MathJax.Hub, this.buffer ],' +
                      'function() {' +
                      'getCKE().tools.callFunction( ' + updateDoneHandler + ' );' +
                      '}' +
                      ');' +
                      '}' +

                      // Run MathJax for the first time, when the script is loaded.
                      // Callback function will be called then it's done.
                      'MathJax.Hub.Queue( function() {' +
                      'getCKE().tools.callFunction(' + loadedHandler + ');' +
                      '} );' +
                      '</script>' +

                      // Load MathJax lib.
                      '<script src="' + ( editor.config.mathJaxLib || cdn ) + '"></script>' +
                      '</head>' +
                      '<body style="padding:0;margin:2px 6px;background:transparent;overflow:hidden">' +
                      '<span id="preview"></span>' +

                      // Render everything here and after that copy it to the preview.
                      '<span id="buffer" style="display:none"></span>' +
                      '</body>' +
                      '</html>' );
        }

        // Run MathJax parsing Tex.
        function update() {
            isRunning = true;

            value = newValue;

            editor.fire( 'lockSnapshot' );

            buffer.setHtml( value );

            // Set loading indicator.
            preview.setHtml( '<img src=' + CKEDITOR.plugins.formula.loadingIcon + ' alt="loading">' );

            iFrame.setStyles( {
                height: '16px',
                width: '16px',
                display: 'inline',
                'vertical-align': 'middle'
            } );

            editor.fire( 'unlockSnapshot' );

            // Run MathJax.
            doc.getWindow().$.update( value );
        }

        return {
            setValue: function( value ) {
                newValue = CKEDITOR.tools.htmlEncode( value );

                if ( isInit && !isRunning )
                    update();
            }
        };
    };

} )();
