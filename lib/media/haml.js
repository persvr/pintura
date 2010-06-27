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

function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
var haml = require('haml/haml');
function partial(template, object){
	var media = require('../media');
	if (template.charAt(0) == '=') {
		template = object && object[template.substring(1)];
	}
	return media.forEachableToString(html.serializeByTemplate(object, {}, {context: template}));
}
haml.filters.partial = partial;

html.cache = config.cache;
html.root = config.root;
html.serializeByTemplate = function(object, request, response){
	var self = this;
	var template;
	if (!object) object = {};
	var filename = response.context;
	if (!this.cache || !haml.cache[filename]) {
		template = require('fs-promise').readFileSync(this.root + '/'+filename+'.haml');
	}
	return {
		forEach: function(write){
			var locals = object || {
				items: object instanceof Array ? object.toRealArray() : object,
			};
			write(haml.render(template, {
				locals: locals,
				cache: self.cache,
				filename: filename
			}));
		}
	};
};
