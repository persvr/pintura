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
		if(false&&async){
			var cookie = req.cookies()["pintura-auth"];
			//TODO: parse the cookie
			return authWorker.call("getAuth",[cookieId]).then(function(result){
				env.authenticatedUser = result;
				return nextApp(env);
			});
		}
		// TODO: needs Basic (and maybe other) authentication
		if(env.headers.authorization){
			var userPass = env.headers.authorization.split(":", 2);
			env.authenticatedUser = security.authenticate(userPass[0], userPass[1]);
		}
		var response = nextApp(env);
		return response;
	};	
};
