/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	
	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	config.plugins = 'autogrow,basicstyles,dialogui,dialog,clipboard,panel,floatpanel,menu,contextmenu,button,toolbar,elementspath,enterkey,entities,popup,filebrowser,floatingspace,listblock,richcombo,format,htmlwriter,wysiwygarea,image,indent,indentlist,fakeobjects,link,sourcearea,specialchar,undo,lineutils,widget,formula';
    config.language = 'zh-cn';
	// %REMOVE_END%

	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		//{ name: 'clipboard',   groups: [ 'undo' ] },
		{ name: 'insert' }
		//{ name: 'forms' },
		//{ name: 'document',	   groups: [ 'mode'] }
	];

	// Remove some buttons provided by the standard plugins, which are
	// not needed in the Standard(s) toolbar.
	config.removeButtons = 'Underline,Subscript,Superscript,Paste,Copy,Cut,Image,SpecialChar';

	// Set the most common block elements.
	config.format_tags = 'p;h1;h2;h3;pre';

	// Simplify the dialog windows.
	config.removeDialogTabs = 'image:advanced;link:advanced';

    config.mathJaxLib = '/math/static/mathjax/MathJax.js';
    //config.removePlugins = 'toolbar,elementspath';
    config.removePlugins = 'elementspath';
    //config.resize_enabled = false;
    config.autoGrow_minHeight = 40;
    config.autoGrow_onStartup = true;
};
