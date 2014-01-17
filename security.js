/**
 * Provides the default mechanism for Pintura's security system.
 */

var AccessError = require("perstore/errors").AccessError,
	first = require("promised-io/lazy-array").first,
	when = require("promised-io/promise").when,
	getCurrentSession = require("./jsgi/session").getCurrentSession,
	Restrictive = require("perstore/facet").Restrictive,
	Promise = require("promised-io/promise").Promise,
	bcrypt = require('bcrypt-nodejs'),
	settings = require("perstore/util/settings");

try{
	var uuid = require("uuid");
}catch(e){

}
exports.userSchema = {
};

exports.DefaultSecurity = function(){
	// allow JSON-RPC authentication
	var Class = require("perstore/model").classModel;

	function authenticate(username, password, expires){
		try{
			return username ? when(security.authenticate(username, password),
				function (user){
					var session = getCurrentSession(true, expires);
					if (session && user) {
						session.user = user.id;
						session.save();
					}
					return user;
				}, onError) : onError();
		}catch(e){
			onError(e);
		}
		// N.B. we use errBack in when() --> any exception will result in silent logout!!!
		function onError(e){
			var session = getCurrentSession();
			if(session && session.user){
				delete session.user;
				session.save();
			}
			if (e) throw e;
		}
	}

	var userModel;
	var admins = settings.security && settings.security.admins;
	var security = {
		encryptPassword: function(password){
			var d = new Promise();
			bcrypt.hash(password, null, null, function(err, hash) {
				if(err) {
					throw new AccessError("Password encryption error occurred: "+err);
					d.reject();
				}
				d.resolve(hash);
			});
			return d;
		},
		comparePassword: function(password, userPassword) {
			var d = new Promise();
			bcrypt.compare(password, userPassword, function(err, isMatch) {
				if (err) {
					throw new AccessError("Password encryption error occurred: "+err);
					d.reject();
				}
				d.resolve(isMatch);
			});
			return d;
		},
		authenticate: function(username, password){
			var comparePassword = this.comparePassword;
			return when(security.getUserModel().get(username), function(user){
				return when(comparePassword(password, user.password), function(isMatch) {
					if(!user || !isMatch){
						// allow admins to authenticate					
						if (!admins || !(user=admins[username]) || !isMatch)
							throw new AccessError("No user with the provided password");
						user.id = username;
					}
					return user;
				});
			});
		},
		createUser: function(username, password){
			if(!username || !password) throw new Error("No username or password specified.");
			return when(this.encryptPassword(password), function(password) {
				return when(security.getUserModel().get(username), function(user){
					// N.B. disallow overwrite admins
					var admins = settings.security.admins;
					if(user || (admins && admins[username]))
						throw new AccessError("User already exists");
					return security.getUserModel().add({
							password: password
						}, {id: username, overwrite: false});
				});
			});
		},
		changePassword: function(username, password){
			if(!username || !password) throw new Error("No username or password specified.");
			return when(this.encryptPassword(password), function(password) {
				return when(security.getUserModel().get(username), function(user){
					// N.B. disallow overwrite admins
					if(!user) throw new Error("User does not exist");
					user.password = password;
					return security.getUserModel().put(user, {id: username, overwrite: true});
				});
			});
		},
		getUserModel: function(){
			if(!userModel){
				var Model = require("perstore/model").Model;
				userModel = Model(exports.userSchema);
				userModel.setPath("User");
			}
			return userModel;
		},
		getAuthenticationFacet: function(){
			return Restrictive(security.getUserModel(), {
				query: function(){
					throw new AccessError("Can not query user objects");
				},
				get: function(){
					throw new AccessError("Can not view user objects");
				},
				post: function(body){
					var username = body.user;
					var password = body.password;
					switch(body.method){
						case "authenticate":
							return authenticate(username, password, body.expires);
						case "createUser":
							return security.createUser(username, password);
						default:
							throw new Error("unknown method " + body.method);
					}
				}
			});
		},
		setUserModel: function(value){
			userModel = value;
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
