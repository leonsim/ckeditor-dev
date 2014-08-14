/**
 * @license Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

var CKBUILDER_CONFIG = {
	skin: 'bootstrapck',
    preset: 'standard',
	ignore: [
		'dev',
		'README.md',
		'.gitignore',
		'.gitattributes',
		'.idea',
		'.mailmap',
		'.DS_Store',
		'tests',
		'package.json',
		'bender.js',
		'.bender',
		'bender-err.log',
		'bender-out.log',
		'node_modules'
	],
	plugins: {
        autogrow: 1,
		basicstyles: 1,
		clipboard: 1,
		colorbutton: 1,
		colordialog: 1,
		contextmenu: 1,
		enterkey: 1,
		entities: 1,
		filebrowser: 1,
		floatingspace: 1,
		format: 1,
        formula: 1,
		htmlwriter: 1,
		image: 1,
		indentlist: 1,
		link: 1,
		sourcearea: 1,
		specialchar: 1,
		toolbar: 1,
		undo: 1,
		wysiwygarea: 1
	},
    languages: {
        'zh-cn': 1
    }
};
