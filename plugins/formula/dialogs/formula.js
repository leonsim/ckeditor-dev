﻿( function() {

    var pluginName = 'formula',
        rebuildSource = null,
        handler = null,
        rebuildFrame = null,
        lastFormulaEle = null,
        lastFormulaFrame = null;

	var formulaDialog = function( editor, dialogType ) {

        var inited = false;

        function insertFormula ( dialog, source ) {

            var ele = null;

            if ( rebuildSource !== null ) {
                ele = rebuildFrame;
                ele.setAttribute( "data-source", source );
                ele.setAttribute( "src", getMathjaxPath( dialog, source ) );
                lastFormulaFrame = ele;
            } else {
                ele = editor.document.createElement( 'iframe' );
                ele.addClass( "kf-formula-expression" );
                ele.setAttribute( "contenteditable", "false" );
                ele.setAttribute( "frameborder", "0" );
                ele.setAttribute( "style", "vertical-align: middle; width: 100px; height: 18px;" );
                ele.setAttribute( "data-source", source );
                ele.setAttribute( "src", getMathjaxPath( dialog, source ) );
                editor.insertElement( ele );
                lastFormulaFrame = ele.$;
            }

            kfEditor.execCommand( "reset" );

        }

        // return Mathjax page URL
        function getMathjaxPath ( dialog, source ) {

            var url = dialog.getElement().find("iframe").getItem(0).$.src;

            url = url.split( "#" )[0];
            url = url.split( "?" )[0];
            url = url.split( "/" );

            url.length -= 1;

            return encodeURI( url.join( "/" ) + "/mathjax.html?" + source );

        }

        return {
            title: '公式',
            width: 780,
            height: 500,
            resizable: CKEDITOR.DIALOG_RESIZE_NONE,

            contents: [
                {
                id: 'viewEdit',
                label: '可视化编辑',
                accessKey: 'F',
                elements: [ {
                    type: 'html',
                    html: '<div style="width: 780px; height: 500px;"><iframe style="width: 100%;height: 100%;" frameborder="0" src="/math/static/ckeditor/plugins/formula/page/index.html"></iframe></div>',
                    onLoad: function() {
                        //console.log(widget);
                    },

                    setup: function( widget ) {
                        top.cur_widget = widget;
                        if (top.kfEditor) {
                            var source = widget.data.math;
                            source = source.slice(2, source.length-2);
                            console.log('setup:' + source);
                            top.kfEditor.execCommand('render', source);
                            //window.setTimeout(function () {
                            //    top.kfEditor.execCommand( "focus" );
                            //}, 100);

                            //top.kfEditor.execCommand('focus');
                        }
                    }
                } ]
            }
            ],


            onShow: function(widget) {
                if ( !inited ) {
                    inited = true;
                    //iframe resize handler
                    top.KF_RESIZE_HANDLER = function ( width, height ) {
                        if ( lastFormulaFrame ) {
                            lastFormulaFrame.style.width = width + 'px';
                            lastFormulaFrame.style.height = height + 'px';
                        }
                    };
                    // 注册引用, 获取ckeditor
                    top.KF_EDITOR = {
                        getParentEditor: function () {
                            return editor;
                        },
                        setRebuild: function ( source, frame ) {
                            rebuildSource = source;
                            rebuildFrame = frame;
                        },
                        getRebuild: function () {
                            return rebuildSource;
                        },
                        clearRebuild: function () {
                            rebuildSource = null;
                            rebuildFrame = null;
                        },
                        setOpenHandler: function ( openHandler ) {
                            handler = openHandler;
                        }
                    };

                    this.getElement().addClass( "kity-formula-dialog" );

                }
            },
            onOk: function() {

                if ( window.kfEditor ) {
                    //console.log('kf:' + kfEditor.execCommand( "get.source" ));
                    top.cur_widget.setData('math', '\\(' + kfEditor.execCommand( "get.source" ) + '\\)');
                    //insertFormula( this, kfEditor.execCommand( "get.source" ) );
                    kfEditor.execCommand( "reset" );
                }

            },
            onCancel: function () {

                if ( window.kfEditor ) {
                    //kfEditor.execCommand( "reset" );
                }

            },
            onHide: function () {
                top.KF_EDITOR.clearRebuild();
            }
        };

    };

	CKEDITOR.dialog.add( pluginName, function( editor ) {
		return formulaDialog( editor, pluginName );
	} );

} )();
