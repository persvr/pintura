/**
 * HAML (http://haml-lang.com/) renderer.
 *
 * Requires the following line in application package.json
 * "haml": "jar:http://github.com/visionmedia/haml.js/zipball/master!/lib/"
 */

var haml = require('haml/haml');
haml.filters.partial = function(str){
	var object = {};
	object.filename = str;
	var media = require('../media');
	return media.forEachableToString(media.Media.instances['text/html'].serialize(object, {}, {}));
}

require('../media').Media({
	mediaType: 'text/html',
	getQuality: function(object){
		return 0.1;
	},
	get cache(){
		return false;
	},
	root: 'public/views',
	serialize: function(object, request, response){
		var self = this;
		var template;
		if (!object) object = {};
		// TODO: what if !object.filename?
		if (!this.cache || !haml.cache[object.filename]) {
			template = require('fs-promise').readFileSync(this.root + '/'+object.filename+'.haml');
		}
		return {
			forEach: function(write){
				write(haml.render(template, {
					locals: object || {
						items: object instanceof Array ? object.toRealArray() : object,
					},
					cache: self.cache,
					filename: object.filename
				}));
			}
		};
	}
});
