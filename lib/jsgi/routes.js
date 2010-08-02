/*
 * Simple RegExp based router. Insprired by simplicity of http://github.com/defrex/node.routes.js.git
 *
 * Declare routes as:
 * 		get(uri, function(request, nextApp, parameters-from-uri){...});
 * 		post(uri, function(request, nextApp, parameters-from-uri){...});
 *  or
 * 		post(uri, new-URI);
 */

var when = require('promised-io/promise').when,
	defer = require('promised-io/promise').defer;

var routes = [];

//function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.Routes = function(customRoutes, nextApp){
	// append custom routes
	for (var i = 0, l = customRoutes.length; i < l; ++i) {
		declare(customRoutes[i]);
	}
	return function(request){
		for (var i = 0, l = routes.length; i < l; ++i) {
			var route = routes[i];
			// try to match the pattern, first literally, then as regular expression
			var args = (request.pathInfo === route.regexp) ? [] :
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
						var response = route.handler.apply(this, args);
						//dir('RESP:', response);
						// continue to execute rules if a special flag is set
						if (!response || !response.__continue__)
							return response;
					// handler is another URI -> just rewrite request.pathInfo
					} else {
						request.pathInfo = route.handler.replace(/\$\d+/g, function(index){
							return args[+(index.substring(1)) - 1];
						});
						//if (route.end)
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
		var named_param_regex = /[\/\.]:(\w+)/g;
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
	return r;
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

exports.del = function(uri, handler){
	var args = Array.prototype.slice.call(arguments, 2);
	declare('DELETE', uri, handler, args);
};

// scaffold GET -- fill -- POST -- GET pattern
// GET and POST
exports.crud = function(uri, handler){
	var args = Array.prototype.slice.call(arguments, 2);
	declare('GET', uri, handler, args);
	declare('POST', uri, handler, args);
};

/*
exports.crud = function(uri, form, success){
	var handler = function(request){
		var response = defer();
		function respond(body){
			response.resolve({
				status: 200,
				headers: {'content-type': 'text/html'},
				body: (body ? body : ['<form method="post" action="' + (form.uri||'') + '">'+form.toHTML()+'<input type="submit" /></form>'])
			});
		}
		if (request.method !== 'GET') {
			form.handle(request.body || {}, {
				success: function(form){
					// do something with collected data
					if (success(form.data))
						respond([]);
					else
						respond();
				},
				other: function(form){
					respond();
				}
			});
		} else {
			respond();
		}
		return response;
	};
	var args = Array.prototype.slice.call(arguments, 1);
	declare(undefined, uri, handler, args);
};
*/
