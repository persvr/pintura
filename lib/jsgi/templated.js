/**
 * Wraps text/html output by a specified HAML template
 *
 * requires "jade": "jar:http://github.com/visionmedia/jade/zipball/master!/lib/" in package.json
 */
function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}

exports.Templated = function(options, nextApp){
	if (!options) options = {};
	//var jade = require('jade/jade');
	var jade = require('haml/haml');
	var media = require('pintura/media');
	var when = require('promised-io/promise').when;
	// re-register text/html media handler
	media.Media({
		mediaType: 'text/html',
		getQuality: function(object){
			return options.force ? 1.0 : 0.1;
		},
		serialize: function(object, request, response){
			var template = request.template || request.store && request.store.id;
			// TODO: reconsider, for the sake of streaming
			var items = object.toRealArray ? object.toRealArray() : object;
			var props = media.getColumnsToExport(request, items[0]);
			//dir(props);
			//return [object.toRealArray()];
			//return [template, object];
			return [jade.partial('list', {items: items, props: props, entity: template, options: options})];
		}
	});
	// serialize untemplated object
	function beautify(object){
		return JSON.stringify(object);
	}
	// extend jade to support includes
	jade.include = function(template){
		while (true) try {
			return require('promised-io/fs').read(options.root + '/' + template + '.haml', 'utf8');
		} catch(x) {
			if (template === 'list') return null; 
			template = 'list';
		}
	};
	// extend jade to support partials
	jade.partial = function(template, locals){
		var html = jade.include(template);
		//dir("HTML:", html);
		if (!html) return beautify(locals);
		return jade.render(html, {
			debug: options.debug,
			context: jade, // N.B. this will be 'this' in templates
			locals: locals, // variables available to the templates
			cache: options.cache,
			filename: template
		});
	};
	//
	return function(request){
		if (options.force)
			request.headers.accept = 'text/html';
		return when(nextApp(request), function(response){
			var html = response.headers['content-type']; html = html && html.indexOf('text/html') >= 0;
			// AJAX call or not text/html -> return pure content
			// TODO: configurable options.skip() to skip wrapping?
			if ((!options.force && !html) || request.xhr)
				return response;
			// vanilla HTML -> wrap it in template
			var template = request.template || response.template || options.template || 'index';
			var locals = ((typeof options.vars === 'function') ? options.vars(request) : options.vars) || {};
			// support flash messages
			locals.flash = response.flash;
			// cache response body
			// TODO: reconsider, for the sake of streaming
			locals.content = media.forEachableToString(response.body);
			// replace response.body with template with content partial set to cached body
			var newBody = jade.partial(template, locals);
			response.body = [newBody];
			return response;
		});
	};
};
