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

function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.Session = function(options, nextApp){
	// assign defaults
	if (!options) options = {};
	if(options.store){
		sessionModel = options.store;
	}
	if (!options.expires) options.expires = -(settings.security.sessionTTL || 300);
	// start the reaper
	// FIXME: ensure underlying store is ready!!!
	/*setTimeout(function(){
		var criteria = require('rql/query').Query('le(expires,$1)', [(new Date()).toISOString()]);
		when(exports.getSessionModel().query(criteria), function(deadSessions){
			if (deadSessions) deadSessions.forEach(function(session){
				security.getSessionModel()['delete'](session.id);
			});
		});
	}, options.expires*1000);*/
	//
	return function(request){
		var session;
		// try to fetch the stored session
		if (settings.security.enableCookieAuth) {
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
		};
		// wait for promised session
		return when(session, function(session){
			// no session found -> create one
			if (!session) {
				// N.B. negative options.expires means the seconds from the current moment
				var expiration = new Date((options.expires < 0) ? ((new Date()).valueOf())-options.expires*1000 : options.expires);
				// generate session nonce
				var newSessionId = exports.generateSessionKey();
				// create new session
				session = {
					id: newSessionId,
					expires: expiration.toISOString()
				};
			}
			// regenerate session nonce
			// N.B. it can be used in hidden form field to secure against multiple submits
			// TODO: rethink!
			if (settings.security.sessionNonce) {
				session.nonce = exports.generateSessionKey();
			}
			// make session available as request.session
			request.session = session;
			// process the request
			return when(nextApp(request), function(response){
				// store the session
				exports.getSessionModel().put(session, {id: session.id, overwrite: true});
				exports.setSessionCookie(response, session.id, new Date(session.expires));
				//
				return response;
			});
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
