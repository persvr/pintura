/*
 * Simple RegExp based router. Insprired by simplicity of http://github.com/defrex/node.routes.js.git
 *
 * Declare routes as:
 * 		get(uri, function(request, nextApp, parameters-from-uri){...});
 * 		post(uri, function(request, nextApp, parameters-from-uri){...});
 */

var routes = [];

exports.Routes = function(customRoutes, nextApp){
	// append custom routes
	for (var i = 0, l = customRoutes.length; i < l; ++i) {
		declare(customRoutes[i]);
	}
	return function(request){
		for (var i = 0, l = routes.length; i < l; ++i) {
			var route = routes[i];
			// try to match the pattern, first literally, then as regular expression
			var args = (request.pathInfo.indexOf(route.regexp) == 0) ? [] :
				(route.regexp instanceof RegExp) && route.regexp.exec(request.pathInfo);
			if (args) {
				// collect arguments
				args.shift(); // kick off the pattern itself
				// append predefined arguments
				if (args instanceof Array)
					args = args.concat(route.args);
				// prepend with middleware info
				args.unshift(request, nextApp);
				// N.B. args are request, nextApp, all-caught-from-regexp, route.args
				if (route.method === undefined || route.method === request.method) {
					// handler is a function -> call it
					if (typeof route.handler === 'function') {
						// N.B. location.handler should behave as vanilla middleware
						return route.handler.apply(this, args);
					// handler is another URI -> just rewrite request.pathInfo
					} else {
						request.pathInfo = route.handler.replace(/\$\d+/g, function(index){
							return args[+(index.substring(1)) - 1];
						});
						break;
					}
				}
			}
		}
		return nextApp(request);
	};
};

function declare(method, regexp, handler, args){
	if (typeof regexp === 'string') {
		var named_param_regex = /\/:(\w+)/g;
		var s = regexp.replace(named_param_regex, '(?:/([^\/]+)|/)');
		// if regexp contains grouping -- make it regexp
		// otherwise leave it as literal string
		if (s !== regexp)
			regexp = new RegExp('^' + s + '$');
	}
	var r = {
		regexp: regexp,
		handler: handler,
		method: method
	};
	if (args)
		r.args = args;
	routes.push(r);
};

exports.get = function(uri, handler){
	var args = Array.prototype.slice.call(arguments, 2);
	declare('GET', uri, handler, args);
};

exports.post = function(uri, handler){
	var args = Array.prototype.slice.call(arguments, 2);
	declare('POST', uri, handler, args);
};

exports.put = function(uri, handler){
	var args = Array.prototype.slice.call(arguments, 2);
	declare('PUT', uri, handler, args);
};

exports['delete'] = function(uri, handler){
	var args = Array.prototype.slice.call(arguments, 2);
	declare('DELETE', uri, handler, args);
};

function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.crud = function(uri, form){
	var handler = function(request){
		var response = require('promise').defer();
		request.xhr = true;
		if (request.method === 'POST') {
dir('POST!!!');
			form.handle(request.body || {}, {
				success: function(form){
dir('OK');//, form.data);
					response.resolve({status: 200, headers: {}, body: [form.data]});
				},
				other: function(form){
dir('OTHER?');//, form.toHTML());
					response.resolve({status: 200, headers: {}, body: [form.toHTML()]});
				}
			});
		} else {
			response.resolve({status: 200, headers: {}, body: '<form method="post">'+form.toHTML()+'<input type="submit" /></form>'});
		}
		return response;
	}
	var args = Array.prototype.slice.call(arguments, 1);
	declare(undefined, uri, handler, args);
};
