/**
 * HAML (http://haml-lang.com/) renderer.
 *
 * Requires the following line in application package.json
 * "haml": "jar:http://github.com/visionmedia/haml.js/zipball/master!/lib/"
 */

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
		var haml = require('haml/haml');
		var self = this;
		var template;
		// TODO: what if !object.filename?
		if (!this.cache || !haml.cache[object.filename]) {
			template = require('fs-promise').readFileSync(this.root + '/'+object.filename+'.haml');
		}
		return {
			forEach: function(write){
				write(haml.render(template, {
					locals: object.locals || {
						items: object instanceof Array ? object.toRealArray() : object,
					},
					cache: self.cache,
					filename: object.filename
				}));
			}
		};
	}
});
