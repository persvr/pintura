/**
 * Wraps text/html output by a specified HAML template
 */
function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.Templated = function(options, nextApp){
	return function(request){
		return require('commonjs-utils/promise').when(nextApp(request), function(response){
			var xhr = request.headers['x-requested-with'] === 'XMLHttpRequest';
			var html = response.headers['content-type']; html = html && html.indexOf('text/html') >= 0;
			// AJAX call or not text/html -> return pure content
			if (!html || xhr)
				return response;
			// vanilla HTML -> wrap it in template
			if (!options) options = {};
			var haml = require('haml/haml');
			// cache template
			var filename = request.template || options.template || 'index';
			try {
				if (!haml.cache[filename])
					var template = require('fs-promise').readFileSync(options.root + '/' + filename + '.haml');
			} catch (x) {
				return response;
	    	}
			// push template arguments
			var locals = options.vars || {};
			// replace response.body
			locals.content = require('pintura/media').forEachableToString(response.body);
//dir('TEMPLATED:', response, locals);
			response.body = {
				forEach: function(write){
					write(haml.render(template, {
						context: haml, // N.B. this will be 'this' in templates
						locals: locals, // variables available to the templates
						cache: true,
						filename: filename
					}));
				}
			};
			return response;
		});
	};
}
