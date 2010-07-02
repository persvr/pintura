/**
 * Provides the default mechanism for Pintura's security system.
 */

var AccessError = require("perstore/errors").AccessError,
	first = require("commonjs-utils/lazy-array").first,
	when = require("commonjs-utils/promise").when,
	bypassSecurity = require("commonjs-utils/settings").bypassSecurity,
	sha1 = require("commonjs-utils/sha1").b64_sha1,
	admins = require("commonjs-utils/settings").admins;

try{
	var uuid = require("uuid");
}catch(e){

}
exports.userSchema = {};
exports.authSchema = {};
var setAuthCookie = require("./jsgi/auth").setAuthCookie;

exports.DefaultSecurity = function(){
	// allow JSON-RPC authentication
	var Class = require("perstore/model").classModel;
	exports.Register = Restrictive(Class, {
		prototype:{
			authenticate: function(source, username, password, expires){
				return authenticate(username, password, expires);
			},
			createUser: function(username, password){
				return security.createUser(username, password);
			}
		},
		quality: 0.1
	});

//function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
	function authenticate(username, password, expires){
		return when(username && security.authenticate(username, password),
			function (user){
				var response;
				// login? -> create a session and respond with session key cookie
				// TODO: prohibit login of logged-in user
				if (user) {
					var authId = security.generateSessionKey(username, password);
					response = when(security.getAuthClass().put({
						user: user.id
					}, {overwrite: false, id: authId}), function(rec){
						var response = setAuthCookie(authId, user.id, expires);
						response.body = user;
						return response;
					});
				// logout -> rip the session, session key cookie
				} else {
					user = require('./jsgi/auth').currentUser;
					response = setAuthCookie();
					// TODO: delete() is not found in Auth
					if (user) {
						security.getAuthClass().store['delete'](user.getSession());
					}
				}
				return response;
			});
	}

	var authClass, userClass;
	var security = {
		encryptPassword: function(username, password){
			return sha1(password);
		},
		generateSessionKey: function(username, password){
			function rnd(){
				return Math.random().toString().substring(2);
			}
			return sha1(rnd()+rnd()+rnd());
		},
		authenticate: function(username, password){
			if(typeof this.encryptPassword === 'function'){
				password = this.encryptPassword(username, password);
			}
			return when(security.getUserClass().get(username), function(user){
				if(!user || (user.password != password)){
					throw new AccessError("No user with the provided password");
				}
				return user;
			});
		},
		createUser: function(username, password){
			if(typeof this.encryptPassword === 'function'){
				password = this.encryptPassword(username, password);
			}
			return when(security.getUserClass().get(username), function(user){
				if(user){
					throw new AccessError("User already exists");
				}
				return security.getUserClass().put({
						password: password
					}, {overwrite: false, id: username});
			});
		},
		getAllowedFacets: function(user, request){
			// make it easy to get going, but all apps will obviously want to override this
			// there is also a ReadOnly facet that is useful
			if((admins && admins.indexOf(user.id) > -1) || bypassSecurity){
				return [FullAccess];
			}
			return [ReadOnly, exports.Register];
		},
		getAuthClass: function(){
			var Model = require("perstore/model").Model;
			if(!authClass){
				authClass = Model("Auth", exports.authSchema);
			}
			return authClass;
		},
		setAuthClass: function(value){
			authClass = value;
		},
		getUserClass: function(){
			var Model = require("perstore/model").Model;
			if(!userClass){
				userClass = Model("User", exports.userSchema);
			}
			return userClass;
		},
		setUserClass: function(value){
			userClass = value;
		}
	};
	exports.userSchema.authenticate = authenticate;

	return security;
};



var Facet = require("perstore/facet").Facet,
	Restrictive = require("perstore/facet").Restrictive;

var FullAccess = exports.FullAccess = Facet(Object, function(store){
	var storeFullAccess = Facet(store, store);
	storeFullAccess.forStore = function(requestedStore){
		return store;
	}
	storeFullAccess.quality = 1;
	return storeFullAccess;
});
FullAccess.forStore = function(store){
	return store;
}
FullAccess.quality = 1;



var ReadOnly = Restrictive(Object, {
/**	appliesTo: Object,
	allowed: function(object, env){
		return true;//env.remoteUser.name == "admin";
	},
/*	load: function(object, source){
		return object;
	},
	update: function(object, source){
		return source;
	},* /

var ReadOnly = new SchemaFacet(Object, {
	additionalProperties:{
		readonly: true
	},*/
	quality: 0.1
});
exports.ReadOnly = ReadOnly;
