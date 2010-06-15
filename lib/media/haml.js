/**
 * HAML (http://haml-lang.com/) renderer.
 * Requires
 * "haml": "jar:http://github.com/visionmedia/haml.js/zipball/master!/lib/"
 * line in application package.json
 */

require('media').Media({
	mediaType: 'text/html',
	getQuality: function(object){
		return 0.1;
	},
	get cache(){
		return false;
	},
	root: 'public',
	serialize: function(object, request, response){
		var haml = require('haml/haml');
		var self = this;
		var template;
		if (!this.cache || !haml.cache[object.filename]) {
			template = require('fs-promise').readFileSync(this.root + '/'+object.filename+'.haml');
		}
		return {
			forEach: function(write){
				write(haml.render(template, {
					locals: object.locals || {
						items: object instanceof Array ? object : object.toRealArray(),
					},
					cache: self.cache,
					filename: object.filename
				}));
			}
		};
	}
});
