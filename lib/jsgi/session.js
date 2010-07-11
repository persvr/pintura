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
	if (!options) options = {};
	if(options.store){
		sessionModel = options.store;
	}
	if (!options.expires) options.expires = -(settings.security.sessionTTL || 300);
	return function(request){
		var context = request.context;
		if(!context){
			context = promiseModule.currentContext = request.context = {};
		}
		// try to fetch the session
		if (settings.security.enableCookieAuth) {
			var cookieId, cookie = request.headers.cookie;
			cookieId = cookie && cookie.match(/pintura-session=([^;]+)/);
			cookieId = cookieId && cookieId[1];
			if (cookieId) {
//dir('SESS?', cookieId);
				if (cookieId === cookieVerification(request)) {
//dir('SESS!', cookieId);
					// allow for cookie-based CSRF verification
					delete request.crossSiteForgeable;
				}
				context.session = exports.getSessionModel().get(cookieId);
			}
		};
		function exportSession(session){
			context.session = session;
			exports.session = function(){
				return session;
			};
			exports.flash = function(message){
				if (arguments.length < 1) {
					var r = session.flash;
					delete session.flash;
					return r;
				} else {
					return session.flash = message;
				}
			};
		}
		// wait for promised session
		return when(context.session, function(session){
			// no session found -> create one
			if (!session && settings.security.forceSession) {
//dir('SESS0', session);
				// N.B. negative options.expires means the seconds from the current moment
				var expiration = new Date((options.expires < 0) ? ((new Date()).valueOf())-options.expires*1000 : options.expires);
				// generate session nonce
				var newSessionId = exports.generateSessionKey();
				// create the session
				// TODO: use add()
				return when(exports.getSessionModel().put({expires: expiration.toISOString()},{id: newSessionId}), function(session){
					// make session available to the context
					exportSession(session);
//dir('SESS+', session);
					// process the request
					return when(nextApp(request), function(response){
						// in the response set the session cookie
						exports.setSessionCookie(response, newSessionId, expiration);
//dir('SESS+>', response);
						return response;
					});
				});
			}
			// make session available to the context
			exportSession(session);
//dir('SESS<-', session, exports.session());
			// process the request
			return when(nextApp(request), function(response){
				if (settings.security.sessionRegenerate) {
					// regenerate session nonce
					var newSessionId = exports.generateSessionKey();
					// N.B. what if ids suddenly collide?!
					exports.getSessionModel()['delete'](session.id);
					exports.getSessionModel().put(session, {id: newSessionId, expires: session.expires});
					// store session cookie
					exports.setSessionCookie(response, newSessionId, new Date(session.expires));
				} else {
					// FIXME: Model.put() doesn't take directives.overwrite?!
					exports.getSessionModel()['delete'](session.id);
					exports.getSessionModel().put(session, {overwrite: true});
				}
//dir('SESS->', session, response);
				// no session at upper layers
				//delete context.session;
				return response;
			});
		}, function(err){
dir('SESS->OOPS', err);
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
// TODO: to be called periodically to rip expired sessions
exports.validateSessions = function(){
	var criteria = require('rql/query').Query('le(expires,$1)', [(new Date()).toISOString()]);
		when(exports.getSessionModel().query(criteria), function(deadSessions){
			if (deadSessions) deadSessions.forEach(function(session){
				security.getSessionModel()['delete'](session.id);
			});
		});
};

exports.generateSessionKey = function(username, password){
	// N.B. sha1 returns not only alphanums! base64 alphabet?
	return sha1(rnd()+rnd()+rnd()).replace(/[^\w]/g, '_');
};
function rnd(){
	return Math.random().toString().substring(2);
}
