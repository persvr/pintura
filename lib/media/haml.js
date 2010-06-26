/**
 * HAML (http://haml-lang.com/) renderer.
 *
 * Requires the following line in application package.json
 * "haml": "jar:http://github.com/visionmedia/haml.js/zipball/master!/lib/"
 *
 * Extends vanilla text/html Media. Set response.context = templateName;
 */

var config = require('commonjs-utils/settings').haml || {
	cache: false,
	root: 'public/views'
};

require('./html');
var html = require('../media').Media.instances['text/html'];

var haml = require('haml/haml');
haml.filters.partial = function(str){
	var object = {};
	var media = require('../media');
	return media.forEachableToString(html.serialize(object, {}, {context: str}));
}

html.cache = config.cache;
html.root = config.root;
html.serializeByTemplate = function(object, request, response){
	var self = this;
	var template;
	if (!object) object = {};
	// TODO: what if !object.filename?
	var filename = response.context;
	if (!this.cache || !haml.cache[filename]) {
		template = require('fs-promise').readFileSync(this.root + '/'+filename+'.haml');
	}
	return {
		forEach: function(write){
			write(haml.render(template, {
				locals: object || {
					items: object instanceof Array ? object.toRealArray() : object,
				},
				cache: self.cache,
				filename: filename
			}));
		}
	};
};
