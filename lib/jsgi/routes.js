/*
 * Simple RegExp based router. Insprired by simplicity of http://github.com/defrex/node.routes.js.git
 */

var declaredLocations = [];

function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.Routes = function(locations, nextApp){
	locations = locations.concat(declaredLocations);
dir('LOC', locations);
	// precompile regexp on the first call
	for (var i = 0, l = locations.length; i < l; ++i) {
		var location = locations[i];
		if (typeof location.regexp === 'string') {
			var named_param_regex = /\/:(\w+)/g;
			var s = location.regexp.replace(named_param_regex, '(?:/([^\/]+)|/)');
			// if location.regexp contains grouping -- make it regexp
			// otherwise leave it as literal string
			if (s !== location.regexp)
				location.regexp = new RegExp('^' + s + '$');
		}
	}
	return function(request){
		for (var i = 0, l = locations.length; i < l; ++i) {
			var location = locations[i];
			// try to match the pattern, first literally, then as regular expression
			var args = (request.pathInfo.indexOf(location.regexp) == 0) ? [] :
				(location.regexp instanceof RegExp) && location.regexp.exec(request.pathInfo);
			if (args) {
				// collect arguments
				args.shift(); // kick off the pattern itself
				// append predefined arguments
				if (args instanceof Array)
					args = args.concat(location.args);
				// prepend with middleware info
				args.unshift(request, nextApp);
				// N.B. args are request, nextApp, all-caught-from-regexp, location.args
				// N.B. location.handler should behave as vanilla middleware
dir('LOC!', location);
				if (typeof location.handler === 'function' && (location.method === undefined || location.method === request.method)) {
					return location.handler.apply(this, args);
				}
			}
		}
		return nextApp(request);
	};
};

exports.declare = function(method, location, handler){
	declaredLocations.push({
		regexp: location,
		handler: handler,
		method: method
	});
};

exports.get = function(location, handler){
	exports.declare('GET', location, handler);
};

exports.post = function(location, handler){
	exports.declare('POST', location, handler);
};
