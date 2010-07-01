/**
 * Provides the default mechanism for Pintura's security system.
 */

var AccessError = require("perstore/errors").AccessError,
	first = require("commonjs-utils/lazy-array").first,
	when = require("commonjs-utils/promise").when,
	bypassSecurity = require("commonjs-utils/settings").bypassSecurity,
	encrypt = require("commonjs-utils/sha1").b64_sha1,
	admins = require("commonjs-utils/settings").admins;

try{
	var uuid = require("uuid");
}catch(e){

}
exports.userSchema = {};
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

	function authenticate(username, password, expires){
		//if (!username) return setAuthCookie();
		return when(username && security.authenticate(username, password),
			function (user){
				var response;
				if (user) {
					// N.B. when do we remove auth session records?! Both expired and due to logout
					response = when(security.getAuthClass().put({
						user: user
					}, {overwrite: false}), function(rec){
						var authId = rec.id || rec._id;
						var response = setAuthCookie(authId, security.getUsername(user), expires);
						response.body = user;
						return response;
					});
				} else {
					// TODO: remove Auth record(s) for the current user
					// TODO: remove all expired Auth records
					response = setAuthCookie();
				}
				return response;
			});
	}

	var authClass, userClass;
	var security = {
		encryptPassword: true,
		authenticate: function(username, password){
			if(this.encryptPassword){
				password = encrypt(password);
			}
			return when(security.getUserClass().get(username), function(user){
				if(!user || (user.password != password)){
					throw new AccessError("No user with the provided password");
				}
				return user;
			});
		},
		createUser: function(username, password){
			if(this.encryptPassword){
				password = encrypt(password);
			} 
			return when(security.getUserClass().get(username), function(user){
				if(user){
					throw new AccessError("User already exists");
				}
				return security.getUserClass().put({
						id: username,
						password: password
					},{overwrite:false});
			});
		},
		getAllowedFacets: function(user, request){
			// make it easy to get going, but all apps will obviously want to override this
			// there is also a ReadOnly facet that is useful
			if((admins && admins.indexOf(this.getUsername(user)) > -1) || bypassSecurity){
				return [FullAccess];
			}
			return [ReadOnly, exports.Authenticate];
		},
		getUsername: function(user){
			return user && (user.username || user.id || user.name) || user;
		},
		getAuthClass: function(){
			var Model = require("perstore/model").Model;
			if(!authClass){
				authClass = Model("Auth",{});
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
