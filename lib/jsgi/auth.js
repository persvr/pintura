/**
 * This middleware module provides authentication
 */
var AccessError = require("perstore/errors").AccessError,
	Response = require("../jsgi/response").Response,
	DatabaseError = require("perstore/errors").DatabaseError,
	when = require("commonjs-utils/promise").when,
	print = require("commonjs-utils/sys").print,
	base64 = require("commonjs-utils/base64");
exports.Authentication = function(security, nextApp){
	security.getUserClass(); // make sure it is initialized
	return function(request){
		// TODO: needs Basic (and maybe other) authentication
		var user = require("commonjs-utils/promise").defer();
		function resolveUser(u){
			if (!u) {
				exports.setAuthCookie();
			}
			user.resolve(u);
		}
		var authorization = request.headers.authorization;
		if(authorization){
			if(authorization.substring(0,6) == "Basic "){
				authorization = base64.decode(authorization.substring(6));
			}
			var userPass = authorization.split(":", 2);
			resolveUser(security.authenticate(userPass[0], userPass[1]));
		}
		else{
			var cookieId, cookie = request.headers.cookie;
			cookieId = cookie && cookie.match(/pintura-auth=([^;]+)/);
			cookieId = cookieId && cookieId[1];
			// TODO: make local.json configurable
			if(cookieId){
				if(// check for to see if it is from the same-origin before validating the request
						// allow for verification of the cookie with a query parameter
						cookieId === cookieVerification(request) ||
						!request.crossSiteForgeable ||
						// it is safe to do GETs with cross-site requests since they have no
						// side-effects, however the JSON serializer must ensure that they
						// don't serialize hijackable content.
						request.method == "GET"){
					// try to find a session for cookieId
					try{
						when(security.getAuthClass().get(cookieId), function(auth){
							// session is ok? -> resolve the user
							if (auth && auth.user) {
								when(security.getUserClass().get(auth.user), resolveUser);
							} else {
								resolveUser(null);
							}
						});
					}
					catch(e){
						if(!(e instanceof DatabaseError)){
							throw e;
						}
					}

				}
				else{
					print("Request may be cross-site forgeable, user authorization will not be " +
							"applied. Include Accept: application/javascript or a Client-Id header " +
							"to prove the request is non-forgeable");
				}
			}else{
				resolveUser(null);
			}
		}
		request.security = security;
		return when(user, function(user){
			exports.currentUser = request.remoteUser = user;
			if (user) user.getSession = function(){return cookieId;}
			if(typeof request.variedOn === "string"){
				// faster way to do it
				request.variedOn += ",Cookie,Authorization";
				return nextApp(request);
			}
			return when(nextApp(request), function(response){
				var headers = response.headers;
				headers.vary = (headers.vary ? headers.vary + "," : "") + "Cookie,Authorization";
				return response;
			});
		});

	};
};

function cookieVerification(request){
	var pinturaAuth = request.queryString.match(/pintura-auth=(\w+)/);
	if(pinturaAuth){
		request.queryString = request.queryString.replace(/pintura-auth=\w+/,'');
		return pinturaAuth[1];
	}
}

exports.setAuthCookie = function(authId, username, expires){
	var response = new Response();
	if(!authId){
		expires = new Date(1);
	}
	response.headers = {
		"set-cookie": "pintura-auth=" + authId + ";path=/" + (expires ? ";expires=" + expires.toUTCString() : ""),
		username: username
	};
	response.body = [];
	response.status = 200;
	return response;
};
