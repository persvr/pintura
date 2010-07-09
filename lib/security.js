/**
 * Provides the default mechanism for Pintura's security system.
 */

var AccessError = require("perstore/errors").AccessError,
	first = require("promised-io/lazy-array").first,
	when = require("promised-io/promise").when,
	settings = require("commonjs-utils/settings"),
	callMethod = require("perstore/facet").callMethod,
	sha1 = require("commonjs-utils/sha1").b64_sha1;

try{
	var uuid = require("uuid");
}catch(e){

}
exports.userSchema = {};

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

	function authenticate(username, password, expires){
		var session = require("./jsgi/session").session(); // N.B. important to refetch on each call!!!
		return username ? when(security.authenticate(username, password),
			function (user){
				session.user = user && user.id;
				return user;
			}, onError) : onError();
		// N.B. we use errBack in when() --> any exception will result in silent logout!!!
		function onError(e){
			if(session.user){
				delete session.user;
			}
			if (e) throw e;
		}
	}

	var userModel;
	var security = {
		encryptPassword: function(username, password){
			return sha1(password);
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
		getAllowedFacets: function(user, request){
			// make it easy to get going, but all apps will obviously want to override this
			// there is also a ReadOnly facet that is useful
			if((settings.security.admins && user && settings.security.admins.indexOf(user.id) > -1) || settings.security.bypass){
				return [FullAccess];
			}
			return [ReadOnly, exports.Register];
		},
		getUserModel: function(){
			var Model = require("perstore/model").Model;
			if(!userModel){
				userModel = Model("User", exports.userSchema);
			}
			return userModel;
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
