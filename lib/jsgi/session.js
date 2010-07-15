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

//function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.Session = function(options, nextApp){
	// assign defaults
	if (!options) options = {};
	if(options.model){
		sessionModel = options.model;
	}
	if (!options.expires) options.expires = -(settings.sessionTTL || 300);
	// start the reaper
	if (typeof exports.getSessionModel().validate === 'function') setTimeout(function(){
		exports.getSessionModel().validate();
	}, options.expires*1000);
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
		var context = request.context;
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
					session.save();
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
	expiration = new Date(expires);

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
			return exports.forceSession(request);
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
		sessionModel = Model("Session", exports.sessionSchema);
	}
	return sessionModel;
};
exports.setSessionModel = function(value){
	sessionModel = value;
};
exports.sessionSchema = {};

exports.setSessionCookie = function(response, sessionId, expires){
	response.headers["set-cookie"] = "pintura-session=" + sessionId + ";HttpOnly;path=/" + (expires ? ";expires=" + expires.toUTCString() : "");
};

exports.generateSessionKey = function(username, password){
	// N.B. sha1 returns not only alphanums! base64 alphabet?
	return sha1(rnd()+rnd()+rnd()).replace(/[^\w]/g, '_');
};
function rnd(){
	return Math.random().toString().substring(2);
}
