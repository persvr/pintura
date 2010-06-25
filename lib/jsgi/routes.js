/*
 * Simple RegExp based router. Insprired by simplicity of http://github.com/defrex/node.routes.js.git
 *
 * Declare routes as:
 * 		get(uri, function(parameters-from-uri, request, nextApp){...});
 * 		post(uri, function(parameters-from-uri, request, nextApp){...});
 */

var routes = [];

//function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.Routes = function(customRoutes, nextApp){
	// append custom routes
	for (var i = 0, l = customRoutes.length; i < l; ++i) {
		declare(customRoutes[i]);
	}
	return function(request){
//dir('ROUTES?', request.pathInfo, routes);
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
				// N.B. args are request, nextApp, all-caught-from-regexp, location.args
				// N.B. location.handler should behave as vanilla middleware
				if (typeof route.handler === 'function' && (route.method === undefined || route.method === request.method)) {
//dir('ROUTE!', route);
					return route.handler.apply(this, args);
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
