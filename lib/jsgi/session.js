/**
 * Middleware for HTTP sessions. Requests will have a getSession(createIfNecessary, expires) 
 * (both arguments optional) method for accessing the session. 
 * Sessions can also be statically accessed with the exported getCurrentSession function.
 * Session middleware can be started with any object store, and defaults to a 
 * Perstore provided session store.
 */
var promiseModule = require("promised-io/promise"),
	when = promiseModule.when,
	settings = require("commonjs-utils/settings"),
	sessionModel,
	sha1 = require("commonjs-utils/sha1").b64_sha1;
	
exports.Session = function(nextApp, store){
	if(store){
		sessionModel = store;
	}
	return function(request){
		var newSessionId, expiration;
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
		var context = request.context;
		if(!context){
			context = promiseModule.currentContext = request.context = {}; 
		}
		context.getSession = request.getSession;
		return when(nextApp(request), function(response){
			if(newSessionId){
				exports.setSessionCookie(response, newSessionId, expiration);
			}
			return response;
		});
	};
};

exports.getCurrentSession = function(createIfNecessary, expiration){
	return promiseModule.currentContext && promiseModule.currentContext.getSession(createIfNecessary, expiration);
}

function cookieVerification(request){
	var pinturaAuth = request.queryString.match(/pintura-session=(\w+)/);
	if(pinturaAuth){
		request.queryString = request.queryString.replace(/pintura-session=\w+/,'');
		return pinturaAuth[1];
	}
}
exports.getSessionModel = function(){
	if(!sessionModel){
		var Model = require("perstore/model").Model;
		sessionModel = Model("Session", exports.sessionSchema);
	}
	return sessionModel;
};
exports.setSessionModel = function(value){
	sessionModel = value;
};

exports.setSessionCookie = function(response, sessionId, expires){
	response.headers["set-cookie"] = "pintura-session=" + sessionId + ";path=/" + (expires ? ";expires=" + expires.toUTCString() : "");
};
exports.sessionSchema = {};
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
