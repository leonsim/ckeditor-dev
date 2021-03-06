/* bender-tags: editor,unit */
/* bender-ckeditor-plugins: entities,enterkey */

( function() {
	'use strict';

	var selectionTools = bender.tools.selection,
		matchOpts = {
			compareSelection: true,
			normalizeSelection: true
		};

	function se( editorName, htmlWithSeleciton, expectedHtmlWithSelection ) {
		return function() {
			var editor = this.editors[ editorName ];

			selectionTools.setWithHtml( editor, htmlWithSeleciton );
			editor.execCommand( 'shiftEnter' );

			var output = selectionTools.getWithHtml( editor );

			assert.isInnerHtmlMatching( expectedHtmlWithSelection, output, matchOpts );
		};
	}

	bender.test( {
		_should: {
			ignore: {
				'test shift+enter key - end of block, inside inline element followed by bogus br': !CKEDITOR.env.needsBrFiller,
				'test shift+enter key - end of list item, inside inline element followed by bogus br': !CKEDITOR.env.needsBrFiller,
			}
		},

		'async:init': function() {
			var that = this;

			bender.tools.setUpEditors( {
				editor: {
					name: 'editor1',
					config: {
						enterMode: CKEDITOR.ENTER_P,
						allowedContent: true
					}
				},

				editorNoAutoParagraph: {
					name: 'editor2',
					config: {
						autoParagraph: false
					}
				}
			}, function( editors, bots ) {
				that.editorBots = bots;
				that.editors = editors;
				that.callback();
			} );
		},

		// #7912
		'test enter key after invisible element': function() {
			// IE restrain making selection in invisible element.
			if ( CKEDITOR.env.ie )
				assert.ignore();

			var bot = this.editorBots.editor,
				editor = bot.editor;

			bot.setHtmlWithSelection( '<p>foo<span style="display:none;">bar^</span></p>' );
			bot.execCommand( 'enter' );
			editor.insertText( 'baz' );

			var output = bender.tools.getHtmlWithSelection( editor );
			output = editor.dataProcessor.toDataFormat( output );

			var expected =
					CKEDITOR.env.safari ?
						'<p>foo</p><p>baz^<span style="display:none;">bar</span></p>' :
						'<p>foo<span style="display:none;">bar</span></p><p>baz^</p>';

			assert.areSame( expected, bender.tools.fixHtml( output ) );
		},

		// #8321
		'test enter key at the end of block with inline styles' : function() {
			var bot = this.editorBots.editor,
				editor = bot.editor;

			bot.setHtmlWithSelection( '<p><b><i>foo^</i></b></p>' );
			bot.execCommand( 'enter' );
			editor.insertText( 'bar' );
			assert.areSame( '<p><b><i>foo</i></b></p><p><b><i>bar</i></b></p>', bot.getData( false, true ) );
		},

		// #7946 TODO: Add editor doc quirks mode tests.
		'test enter key key scrolls document' : function() {
			var bot = this.editorBots.editor,
				editor = bot.editor;

			editor.focus();
			bot.setHtmlWithSelection( '^' );

			// Press enough enter key in order overflow the content area.
			var i = 0;
			while ( i++ < 20 ) bot.execCommand( 'enter' );
			var start = editor.getSelection().getStartElement();
			var rect = start.$.getBoundingClientRect();
			var viewport = bot.editor.window.getViewPaneSize();

			// Make sure the cursor is inside of viewport.
			assert.isTrue( rect.top < viewport.height && rect.top > 0 );
		},

		// Start of #8812
		'test ener key at the end of contents with comment' : function() {
			var bot = this.editorBots.editor;

			bot.setHtmlWithSelection( 'test ^<!-- --> ' );
			bot.execCommand( 'enter' );
			assert.areSame( '<p>test <!-- --></p><p>&nbsp;</p>', bot.getData( false, true ) );
		},

		'test enter key in the middle of contents with comments' : function() {
			var bot = this.editorBots.editor;

			bot.setHtmlWithSelection( '<!-- baz -->foo^bar<!-- baz -->' );
			bot.execCommand( 'enter' );

			// IE9+Compat looses the first comment, so we remove it from the assertion (not related to #8812).
			assert.areSame( '<p>foo</p><p>bar</p>', bot.getData( false, true ).replace( /<![^>]+>/g, '' ) );
		},

		'test enter key in the middle of contents with comments (2)' : function() {
			var bot = this.editorBots.editor;

			bot.setHtmlWithSelection( '<b>foo</b>bar^baz<!-- --><b>qux</b>' );
			bot.execCommand( 'enter' );

			assert.areSame( '<p><b>foo</b>bar</p><p>baz<!-- --><b>qux</b></p>', bot.getData( false, true ) );
		},
		// End of #8812

		'test enter key uses editor.activeEnterMode': function() {
			var bot = this.editorBots.editorNoAutoParagraph;

			bot.editor.setActiveEnterMode( CKEDITOR.ENTER_BR, CKEDITOR.ENTER_DIV );

			try {
				bot.setHtmlWithSelection( 'foo^bar' );
				bot.execCommand( 'enter' );
				assert.areSame( 'foo<br />bar', bot.getData(), 'br mode was used' );

				bot.setHtmlWithSelection( 'foo^bar' );
				bot.execCommand( 'shiftEnter' );
				assert.areSame( '<div>foo</div><div>bar</div>', bot.getData(), 'div mode was used' );
			} catch ( e ) {
				throw e;
			} finally {
				// Always reset enter mode - even if previous test failed.
				bot.editor.setActiveEnterMode( null, null );
			}

			bot.setHtmlWithSelection( 'foo^bar' );
			bot.execCommand( 'enter' );
			assert.areSame( '<p>foo</p><p>bar</p>', bot.getData(), 'main mode was used' );
		},

		'test enter key is influenced by the active filter': function() {
			var bot = this.editorBots.editorNoAutoParagraph;

			bot.setHtmlWithSelection( 'foo^bar' );

			var filter = new CKEDITOR.filter( 'div' );
			bot.editor.setActiveFilter( filter );

			try {
				bot.execCommand( 'enter' );
				assert.areSame( '<div>foo</div><div>bar</div>', bot.getData(), 'div mode was used' );
			} catch ( e ) {
				throw e;
			} finally {
				// Always reset filter - even if previous test failed.
				bot.editor.setActiveFilter( null );
			}

			bot.setHtmlWithSelection( 'foo^bar' );
			bot.execCommand( 'enter' );
			assert.areSame( '<p>foo</p><p>bar</p>', bot.getData(), 'main mode was used' );
		},

		/*
		// Commented out until we decide whether we want to block enter key completely and how.
		'test enter key is completely blocked if neither p nor br are allowed': function() {
			var bot = this.editorBot;
			bot.setHtmlWithSelection( '<p>foo^bar</p>' );

			var filter = new CKEDITOR.filter( 'x' );
			this.editor.setActiveFilter( filter );

			try {
				bot.execCommand( 'enter' );
				assert.areSame( '<p>foobar</p>', bot.getData(), 'enter is blocked' );
			} catch ( e ) {
				throw e;
			} finally {
				// Always reset filter - even if previous test failed.
				this.editor.setActiveFilter( null );
			}
		},
		*/

		'test shift+enter key - middle of block':		se( 'editor', '<p>foo{}bar</p>', '<p>foo<br />^bar@</p>' ),
		'test shift+enter key - list item':				se( 'editor', '<ul><li>foo{}bar</li></ul>', '<ul><li>foo<br />^bar@</li></ul>' ),
		'test shift+enter key - start of block':		se( 'editor', '<p>{}foobar</p>', '<p><br />^foobar@</p>' ),
		'test shift+enter key - end of block':			se( 'editor', '<p>foobar{}</p>', '<p>foobar<br />^@</p>' ),
		'test shift+enter key - before br':				se( 'editor', '<p>foo{}<br />bar</p>', '<p>foo<br />^<br />bar@</p>' ),
		'test shift+enter key - after br':				se( 'editor', '<p>foo<br />{}bar</p>', '<p>foo<br /><br />^bar@</p>' ),
		// #11947
		'test shift+enter key - end of block, inside inline element followed by bogus br':
			se( 'editor', '<p><em>foo{}</em><br /></p>', '<p><em>foo<br />^</em><br /></p>' ),
		'test shift+enter key - end of list item, inside inline element followed by bogus br':
			se( 'editor', '<ul><li><em>foo{}</em><br /></li></ul>', '<ul><li><em>foo<br />^</em><br /></li></ul>' ),
	} );

} )();