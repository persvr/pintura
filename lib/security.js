/**
 * Provides the default mechanism for Pintura's security system.
 */

var AccessError = require("perstore/errors").AccessError,
	first = require("promised-io/lazy-array").first,
	when = require("promised-io/promise").when,
	settings = require("commonjs-utils/settings"),
	getCurrentSession = require("./jsgi/session").getCurrentSession,
	Restrictive = require("perstore/facet").Restrictive,
	sha1 = require("commonjs-utils/sha1").b64_sha1;

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
				session.user = null;
				session.save();
			}
			if (e) throw e;
		}
	}
	
	var userModel;
	var security = {
		encryptPassword: function(username, password){
			return password && sha1(password);
		},
		authenticate: function(username, password){
			if(typeof this.encryptPassword === 'function'){
				password = this.encryptPassword(username, password);
			}
			return when(security.getUserModel().get(username), function(user){
				if(!user || (user.password !== password)){
					throw new AccessError("No user with the provided password");
				}
				return user;
			});
		},
		createUser: function(username, password){
			if(typeof this.encryptPassword === 'function'){
				password = this.encryptPassword(username, password);
			}
			return when(security.getUserModel().get(username), function(user){
				if(user){
					throw new AccessError("User already exists");
				}
				return security.getUserModel().put({
						password: password
					}, {overwrite: false, id: username});
			});
		},
		getUserModel: function(){
			var Model = require("perstore/model").Model;
			if(!userModel){
				userModel = Model(exports.userSchema);
				userModel.setPath("User");
			}
			return userModel;
		},
		getAuthenticationFacet: function(){
			return Restrictive(security.getUserModel(), {
				query: function(){
					throw new AccessError("Can not view user objects");
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
							throw new Error("unknown method " + method);
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
