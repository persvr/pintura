/**
 * This middleware module provides authentication
 */
var AccessError = require("security").AccessError,
	Response = require("jsgi/response").Response;
	
exports.Authentication = function(security, nextApp){
	security.userStore; // make sure it is initialized
	return function(request){
		// TODO: needs Basic (and maybe other) authentication
		if(request.headers.authorization){
			var userPass = request.headers.authorization.split(":", 2);
			request.authenticatedUser = security.authenticate(userPass[0], userPass[1]);
		}
		else if((!request.crossSiteForgeable || request.method == "GET")){
			// it is safe to do GETs since they have no side-effect, however the JSON
			// serializer must ensure that they don't serialize hijackable content
			var cookieId, cookie = request.headers.cookie;
			cookieId = cookie && cookie.match(/pintura-auth=([^;]+)/);
			cookieId = cookieId && cookieId[1];
			if(cookieId){
				var auth = security.authStore.get(cookieId);
				request.authenticatedUser = auth && auth.user; 
			}
		}
		return nextApp(request);
	};	
};

exports.setAuthCookie = function(authId, expires){
	var response = new Response();
	response.headers = {
		"set-cookie": "pintura-auth=" + authId + (expires ? ";expires=" + expires : "")
	};
	response.status = 200;
	return response;
};