/**
 * Wraps text/html output by a specified HAML template
 *
 * requires "jade": "jar:http://github.com/visionmedia/jade/zipball/master!/lib/" in package.json
 */
function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}

exports.Templated111 = function(options, nextApp){
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
			//dir('RENDER', object, object.toRealArray);
			if (object) {
				if (object.toRealArray) {
					var items = object.toRealArray();
					var props = media.getColumnsToExport(request, items[0]);
					object = {items: items, props: props, options: options};
				}
			}
			object.entity = template;
			var template = request.template || request.store && request.store.id;
			return [exports.render(template, object, 'list')];
		}
	});
	// extend jade to support includes
	jade.include = function(template, fallback){
		if (!template) return null;
		while (true) try {
			return require('promised-io/fs').read(options.root + '/' + template + '.haml', 'utf8');
		} catch(x) {
			if (!fallback || template === fallback) return null;
			template = fallback;
		}
	};
	// extend jade to support partials
	jade.partial = function(template, locals, fallback){
		if (!template) return '';
		var html = jade.include(template, fallback);
		return html ? jade.render(html, {
			debug: options.debug,
			context: jade, // N.B. this will be 'this' in templates
			locals: locals, // variables available to the templates
			cache: options.cache,
			filename: template
		}) : 'Bad template ' + template;
	};
	//
	exports.render = jade.partial;
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
			var template = options.template || 'index';
			var locals = ((typeof options.vars === 'function') ? options.vars(request) : options.vars) || {};
			locals.session = require('./session').session();
			// support flash messages
			locals.flash = require('./session').flash();
//dir('VARS:', locals);
			locals.content = media.forEachableToString(response.body);
			//response.body = [render(template, locals, request, response)];
			response.body = [exports.render(template, locals)];
			return response;
		});
	};
};















exports.Templated222 = function(options, nextApp){
	if (!options) options = {};
	var engine = require('jazz/jazz');
	var media = require('pintura/media');
	var when = require('promised-io/promise').when;
	// extend jazz to support includes
	function include(template, fallback, cb){
		if (template === null || template === undefined) template = '';
		while (true) try {
//dir('INCLUDE:', template);
			return require('promised-io/fs').read(options.root + '/' + template + '.html', 'utf8');
		} catch(x) {
			if (!fallback || template === fallback) return null;
			template = fallback;
		}
	}
	// re-register text/html media handler
	var render;
	media.Media({
		mediaType: 'text/html',
		getQuality: function(object){
			return options.force ? 1.0 : 0.1;
		},
		serialize: render = function(object, request, response){
			//dir('RENDER', object, object.toRealArray);
			if (object) {
				if (object.toRealArray) {
					var items = object.toRealArray();
					var props = media.getColumnsToExport(request, items[0]);
					object = {items: items, props: props, options: options};
				}
			}
			object.entity = template;
			var template = request.template || request.store && request.store.id;
			return {
				forEach: function(write){
					var data = include(template) || include('') || 'Empty template!';
dir('RENDER', template, object, data);
					var tpl = engine.compile(data);
					//object.include = include;
					object.get = function(obj, prop){
dir('GET', obj, prop);
						return obj[prop] || 'NA';
					};
					tpl.eval(object, function(html){
						write(html);
					});
				}
			};
		}
	});
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
			var locals = ((typeof options.vars === 'function') ? options.vars(request) : options.vars) || {};
			locals.session = require('./session').session();
			// support flash messages
			locals.flash = require('./session').flash();
dir('VARS:', locals);
			locals.content = media.forEachableToString(response.body);
			//request.template = options.template || 'index';
			//response.body = [media.Media.instances['text/html'].serialize(locals, request, response)];
			response.body = [render(locals, request, response)];
			return response;
		});
	};
};








exports.Templated333 = function(options, nextApp){
	if (!options) options = {};
	var engine = require('normal-template/normal-template');
	var media = require('pintura/media');
	var when = require('promised-io/promise').when;
	// extend jazz to support includes
	function include(template, fallback, cb){
		if (template === null || template === undefined) template = '';
		while (true) try {
//dir('INCLUDE:', template);
			return require('promised-io/fs').read(options.root + '/' + template + '.html', 'utf8');
		} catch(x) {
			if (!fallback || template === fallback) return null;
			template = fallback;
		}
	}
	// re-register text/html media handler
	var render;
	media.Media({
		mediaType: 'text/html',
		getQuality: function(object){
			return options.force ? 1.0 : 0.1;
		},
		serialize: render = function(object, request, response){
			//dir('RENDER', object, object.toRealArray);
			if (object) {
				if (object.toRealArray) {
					var items = object.toRealArray();
					var props = media.getColumnsToExport(request, items[0]);
					object = {items: items, props: props, options: options};
				}
			}
			object.entity = template;
			var template = request.template || request.store && request.store.id;
			var data = include(template) || include('') || 'Empty template!';
dir('RENDER', template, object, data);
			var tpl = engine.compile(data);
			var html = tpl(object);
dir('HTML', html);
			return [html];
		}
	});
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
			var locals = ((typeof options.vars === 'function') ? options.vars(request) : options.vars) || {};
			locals.session = require('./session').session();
			// support flash messages
			locals.flash = require('./session').flash();
dir('VARS:', locals);
			locals.content = media.forEachableToString(response.body);
			//request.template = options.template || 'index';
			//response.body = [media.Media.instances['text/html'].serialize(locals, request, response)];
			response.body = [render(locals, request, response)];
			return response;
		});
	};
};








exports.Templated = function(options, nextApp){
	if (!options) options = {};
	var engine = require('ejs/ejs');
	var media = require('pintura/media');
	var when = require('promised-io/promise').when;
	function include(template, fallback){
		if (template === null || template === undefined) template = '';
		while (true) try {
//dir('INCLUDE:', template);
			return require('promised-io/fs').read(options.root + '/' + template, 'utf8');
		} catch(x) {
			if (!fallback || template === fallback) return null;
			template = fallback;
		}
	}
	// re-register text/html media handler
	var oldSerializer = media.Media.instances['text/html'].serialize;
	var render;
	media.Media({
		mediaType: 'text/html',
		getQuality: function(object){
			return options.force ? 1.0 : 0.1;
		},
		serialize: render = function(object, request, response){
			var template = request.nodeRequest.url.replace(/\?.*$/, '');
			var str = include(template, template.substring(template.lastIndexOf('.')));
			if (str === null) return oldSerializer(object, request, response);
			//dir('RENDER', object, object.toRealArray);
			if (object) {
				if (object.toRealArray) {
					var items = object.toRealArray();
					var props = media.getColumnsToExport(request, items[0]);
					object.items = items;
					object.props = props;
				}
				object.entity = request.store && request.store.id;
				object.options = options;
				//object.vars = ((typeof options.vars === 'function') ? options.vars(request) : options.vars) || {};
			}
//dir('RENDER', template, object);
			var html = engine.render(str, {
				//debug: options.debug,
				context: engine, // N.B. this will be 'this' in templates
				locals: object, // variables available to the templates
				cache: options.cache,
				filename: template
			});
//dir('HTML', html);
			return [html];
		}
	});
	return function(request){
return nextApp(request);
		if (options.force)
			request.headers.accept = 'text/html';
		return when(nextApp(request), function(response){
			var html = response.headers['content-type']; html = html && html.indexOf('text/html') >= 0;
			// AJAX call or not text/html -> return pure content
			// TODO: configurable options.skip() to skip wrapping?
			if ((!options.force && !html) || request.xhr)
				return response;
			// vanilla HTML -> wrap it in template
			var locals = ((typeof options.vars === 'function') ? options.vars(request) : options.vars) || {};
			locals.session = require('./session').session();
			// support flash messages
			locals.flash = require('./session').flash();
//dir('VARS:', locals);
			locals.content = media.forEachableToString(response.body);
			//request.template = options.template || 'index';
			response.body = [render(locals, request, response)];
			return response;
		});
	};
};
