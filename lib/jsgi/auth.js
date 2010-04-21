/**
 * This middleware module provides authentication
 */
var AccessError = require("perstore/errors").AccessError,
	Response = require("../jsgi/response").Response,
	DatabaseError = require("perstore/errors").DatabaseError,
	when = require("promise").when,
	print = require("system").print,
	base64 = require("commonjs-utils/base64");
exports.Authentication = function(security, nextApp){
	security.getUserClass(); // make sure it is initialized
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
			var cookieId, cookie = request.headers.cookie;
			cookieId = cookie && cookie.match(/pintura-auth=([^;]+)/);
			cookieId = cookieId && cookieId[1];
			if(cookieId){
				if(// check for to see if it is from the same-origin before validating the request
						// allow for verification of the cookie with a query parameter
						cookieId === cookieVerification(request) ||
						!request.crossSiteForgeable || 
						// it is safe to do GETs with cross-site requests since they have no 
						// side-effects, however the JSON serializer must ensure that they 
						// don't serialize hijackable content.
						request.method == "GET"){
					try{
						when(security.getAuthClass().get(cookieId), function(auth){
							user = auth && auth.user;
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
			}
		}
		request.security = security;
		return when(user, function(user){
			exports.currentUser = request.remoteUser = user;
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
		expires = new Date(1).toGMTString();
	}
	else if(typeof expires === "number"){
		expires = new Date(expires).toGMTString();
	}
	response.headers = {
		"set-cookie": "pintura-auth=" + authId + ";path=/" + (expires ? ";expires=" + expires : ""),
		username: username
	};
	response.status = 200;
	return response;
};
