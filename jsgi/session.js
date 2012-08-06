/**
 * Middleware for HTTP sessions. Requests will have a getSession(createIfNecessary, expires)
 * (both arguments optional) method for accessing the session.
 * Sessions can also be statically accessed with the exported getCurrentSession function.
 * Session middleware can be started with any object store, and defaults to a
 * Perstore provided session store.
 */
var promiseModule = require("promised-io/promise"),
	when = promiseModule.when,
	settings = require("perstore/util/settings"),
	sessionModel,
	sha1 = require("../util/sha1").hex_sha1;

exports.Session = function(options, nextApp){
	// assign defaults
	if (!options) options = {};
	if(options.model){
		sessionModel = options.model;
	}
	if (!options.expires) options.expires = -(settings.sessionTTL || 300);
	// start the reaper
	// TODO: get a timer for narwhal
	function validate() {
		// allow for this to occur asynchronously
		when(exports.getSessionModel().validate(), function () {
			setTimeout(validate, options.expires * -1000);
		});
	}
	if (typeof exports.getSessionModel().validate === 'function' && typeof setTimeout !== "undefined") {
		validate();
	}
	//
	return function(request){
		var session;
		// try to fetch the stored session
		var cookieId, cookie = request.headers.cookie;
		cookieId = cookie && cookie.match(/pintura-session=([^;]+)/);
		cookieId = cookieId && cookieId[1];
		if (cookieId) {
			if (cookieId === cookieVerification(request)) {
				// allow for cookie-based CSRF verification
				delete request.crossSiteForgeable;
			}
			session = exports.getSessionModel().get(cookieId);
		}
		var context = promiseModule.currentContext;
		if(!context){
			context = promiseModule.currentContext = request.context = {};
		}
		context.request = request;
		// wait for promised session
		return when(session, function(session){
			// create new session
			if (!session && settings.forceSession) {
				session = exports.forceSession(request, options.expires);
			}
			// make session available as request.session
			request.session = session;
			// process the request
			return when(nextApp(request), function(response){
				// store session cookie
				if(settings.forceSession || !session && request.session){
					exports.setSessionCookie(response, request.session.id, new Date(request.session.expires));
				}
				// save session
				if (settings.forceSession) {
					return when(exports.getSessionModel().put(session, {overwrite: true}), function(){
						return response;
					});
				}
				return response;
			});
		});
	};
};

// gets a session, creating a new one if necessary
exports.forceSession = function(request, expires){
	var session = request.session;
	if(session){
		return session;
	}
	var newSessionId = exports.generateSessionKey();
	if (!expires) expires = -(settings.sessionTTL || 300);
	if (expires < 0)
		expires = ((new Date()).valueOf())-expires*1000;
	var expiration = new Date(expires);

	// TODO: use add()
	session = request.session = {
		expires: expiration.toISOString(),
		id: newSessionId
	};
	exports.getSessionModel().construct(session);
	return session;
};

exports.getCurrentSession = function(createIfNecessary, expiration){
	var request = promiseModule.currentContext && promiseModule.currentContext.request;
	if(request){
		if(request.session){
			return request.session;
		}
		if(createIfNecessary){
			return exports.forceSession(request, expiration);
		}
	}
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
		sessionModel = Model(exports.sessionSchema);
		sessionModel.setPath("Session");
	}
	return sessionModel;
};
exports.setSessionModel = function(value){
	sessionModel = value;
};
exports.sessionSchema = {};

exports.setSessionCookie = function(response, sessionId, expires){
	if (!response.headers) response.headers = {};
	response.headers["set-cookie"] = "pintura-session=" + sessionId + ";" + (settings.security.httpOnlyCookies ? "HttpOnly;" : "") + "path=/" + (expires ? ";expires=" + expires.toUTCString() : "");
};

exports.generateSessionKey = function(username, password){
	return sha1(rnd()+rnd()+rnd()) + sha1(rnd()+rnd()+rnd());
};
function rnd(){
	return Math.random().toString().substring(2);
}
