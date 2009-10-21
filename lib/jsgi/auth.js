/**
 * This middleware module provides authentication
 */
var authWorker = require("json-rpc-worker").client(new (require("worker").SharedWorker)("auth-worker", "auth-worker")),
	AccessError = require("security").AccessError,
	Request = require("jack/request").Request;
exports.Authentication = function(security, nextApp){
	return function(env){
		var req = new Request(env);
		var async = env.jsgi.async;
		// TODO: needs Basic (and maybe other) authentication
		if(env.headers.authorization){
			var userPass = env.headers.authorization.split(":", 2);
			env.authenticatedUser = security.authenticate(userPass[0], userPass[1]);
		}
		else if((!env.crossSiteForgeable || env.method == "GET") && async){
			// it is safe to do GETs since they have no side-effect, however the JSON
			// and JS serializers must ensure that they don't serialize hijackable content
			var cookieId = req.cookies()["pintura-auth"];
			if(cookieId){
				env.authenticatedUser = security.authStore.get(cookieId);
			}
		}
		var response = nextApp(env);
		return response;
	};	
};
