/**
 * Wraps text/html output by a specified HAML template
 *
 * requires "haml": "jar:http://github.com/visionmedia/haml.js/zipball/master!/lib/" in package.json
 */
function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.Templated = function(options, nextApp){
	if (!options) options = {};
	var haml = require('haml/haml');
	var Stringify = require('pintura/media').forEachableToString;
	haml.partial = function(template, locals){
		// cache template
		var filename = template;
		try {
			if (!haml.cache[filename])
				var template = require('fs-promise').readFileSync(options.root + '/' + filename + '.haml');
		} catch (x) {
			return JSON.stringify(locals);//.toString();
    	}
		// merge locals and template
		return haml.render(template, {
			context: haml, // N.B. this will be 'this' in templates
			locals: locals, // variables available to the templates
			cache: true,
			filename: filename
		});
	}
	return function(request){
		return require('commonjs-utils/promise').when(nextApp(request), function(response){
			var xhr = request.headers['x-requested-with'] === 'XMLHttpRequest';
			var html = response.headers['content-type']; html = html && html.indexOf('text/html') >= 0;
			// AJAX call or not text/html -> return pure content
			// TODO: configurable options.skip() to skip wrapping?
			if (!html || xhr)
				return response;
			// vanilla HTML -> wrap it in template
			var template = request.template || options.template || 'index';
			var locals = options.vars || {};
			locals.content = Stringify(response.body); // cache response body
			// replace response.body with template with content partial set to cached body
//dir('TEMPLATED:', response, locals);
			response.body = {
				forEach: function(write){
					write(haml.partial(template, locals));
				}
			};
			return response;
		});
	};
}
