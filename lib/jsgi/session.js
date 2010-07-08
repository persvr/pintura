/**
 * This middleware module provides authentication
 */
var when = require("promised-io/promise").when,
	settings = require("commonjs-utils/settings"),
	sha1 = require("commonjs-utils/sha1").b64_sha1;

exports.Session = function(nextApp){
	var newSessionId, expiration;
	return function(request){
		request.getSession = function(createIfNecessary, expires){
			var cookieId, cookie = request.headers.cookie;
			cookieId = cookie && cookie.match(/pintura-session=([^;]+)/);
			cookieId = cookieId && cookieId[1];
			// TODO: make local.json configurable
			if(cookieId){
				if(cookieId === cookieVerification(request)){
					// allow for cookie-based CSRF verification
					delete request.crossSiteForgeable;
				}
				return exports.getSessionModel().get(cookieId);
			}else if(createIfNecessary){
				newSessionId = exports.generateSessionKey();
				if (!expires) expires = -(settings.sessionTTL || 300);
				if (expires < 0)
					expires = ((new Date()).valueOf())-expires*1000;
				expiration = new Date(expires);

				// TODO: use add()
				return exports.getSessionModel().put({
					expires: expiration.toISOString()
				},{
					id: newSessionId
				});
			}
		};

		exports.currentSession = request.getSession;
		return when(nextApp(request), function(response){
			if(newSessionId){
				exports.setSessionCookie(response, newSessionId, expiration);
			}
			return response;
		});
	};
};

function cookieVerification(request){
	var pinturaAuth = request.queryString.match(/pintura-session=(\w+)/);
	if(pinturaAuth){
		request.queryString = request.queryString.replace(/pintura-session=\w+/,'');
		return pinturaAuth[1];
	}
}

/*
// N.B. caching this model prevents robust exports.getSessionModel() override!
var sessionModel;
exports.getSessionModel = function(){
	var Model = require("perstore/model").Model;
	if(!sessionModel){
		sessionModel = Model("Session", exports.sessionSchema);
	}
	return sessionModel;
};
exports.setSessionModel = function(value){
	sessionModel = value;
};
exports.sessionSchema = {};
*/

exports.setSessionCookie = function(response, sessionId, expires){
	response.headers["set-cookie"] = "pintura-session=" + sessionId + ";HttpOnly;path=/" + (expires ? ";expires=" + expires.toUTCString() : "");
};
// TODO: to be called periodically to rip expired sessions
exports.validateSessions = function(){
	var criteria = require('rql/query').Query('le(expires,$1)', [(new Date()).toISOString()]);
		when(exports.setSessionModel().query(criteria), function(deadSessions){
			//dir('CORPS:', deadSessions);
			deadSessions.forEach(function(session){
				//dir('CORPS:', session);
				// N.B. delete() is not found in Model()
				//callMethod(security.getAuthClass(), 'delete', [session.id]);
				security.getAuthClass()['delete'](session.id);
			});
		});
};

exports.generateSessionKey = function(username, password){
	return sha1(rnd()+rnd()+rnd());
};
function rnd(){
	return Math.random().toString().substring(2);
}
