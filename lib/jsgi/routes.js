/*
 * Simple RegExp based router. Insprired by simplicity of http://github.com/defrex/node.routes.js.git
 */
exports.Routes = function(locations, nextApp){
	return function(request){
		for (var i = 0, l = locations.length; i < l; ++i) {
			var location = locations[i];
			// compile regexp on the first call
			if (typeof location.regexp === 'string') {
				var named_param_regex = /\/:(\w+)/g;
				var s = location.regexp.replace(named_param_regex, '(?:/([^\/]+)|/)');
				location.regexp = new RegExp('^' + s + '$');
			}
			var args = location.regexp.exec(request.pathInfo);
			if (args) {
				// simple redirect?
				if (location.redirect)
					// yes. redirect to target
					return require('jack/redirect').Redirect(location.redirect)(request);
				// no. call a function
				// collect arguments
				args.shift(); // kick off the pattern itself
				// append predefined arguments
				if (args instanceof Array)
					args = args.concat(location.args);
				// prepend with middleware info
				args.unshift(request, nextApp);
				// N.B. args are request, nextApp, all-caught-from-regexp, location.args
				// N.B. location.execute should behave as vanilla middleware
				if (typeof location.execute === 'function') {
					return location.execute.apply(this, args);
				}
			}
		}
		return nextApp(request);
	};
};
