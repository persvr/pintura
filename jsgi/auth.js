/**
 * This middleware module provides authentication
 */
var AccessError = require("perstore/errors").AccessError,
	Response = require("./response").Response,
	DatabaseError = require("perstore/errors").DatabaseError,
	promiseModule = require("promised-io/promise"),
	when = promiseModule.when,
	print = require("promised-io/process").print,
	base64 = require("../util/base64");

var Authentication = function(security, nextApp){
	// initialize the user model
	security.getUserModel();
	return function(request){
		// TODO: needs Basic (and maybe other) authentication
		var user;
		var authorization = request.headers.authorization;
		if(authorization){
			if(authorization.substring(0,6) == "Basic "){
				authorization = base64.decode(authorization.substring(6));
			}
			var userPass = authorization.split(":", 2);
			user = security.authenticate(userPass[0], userPass[1]);
		}
		else{
			var session = request.session;
			if(session){
				if(// check to see if it is from the same-origin before validating the request
						!request.crossSiteForgeable ||
						// it is safe to do GETs with cross-site requests since they have no
						// side-effects, however the JSON serializer must ensure that they
						// don't serialize hijackable content.
						request.method == "GET"){
					user = when(session, function(session){
						// session is ok? -> resolve the user
						return session && session.user;
					});
				}
				else{
					print("Request may be cross-site forgeable, user authorization will not be " +
							"applied. Include Accept: application/javascript or a Client-Id header " +
							"to prove the request is non-forgeable");
					user = null;
				}
			}
		}
		request.security = security;
		if(user){
			return when(user, function(user){
				var context = promiseModule.currentContext;
				if(!context){
					promiseModule.currentContext = context = {};
				}
				context.currentUser = request.remoteUser = user && (user.id || user);
				return nextApp(request);
			});
		}else{
			return nextApp(request);
		}

	};
};
Authentication.Authentication = Authentication;
module.exports = Authentication;