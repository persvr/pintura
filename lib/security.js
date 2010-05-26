/**
 * Provides the default mechanism for Pintura's security system.
 */
 
var AccessError = require("perstore/errors").AccessError,
	first = require("commonjs-utils/lazy-array").first,
	when = require("promise").when,
	bypassSecurity = require("commonjs-utils/settings").bypassSecurity,
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
	exports.Authenticate = Restrictive(Class, {
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
		return when(username && security.authenticate(username, password),
			function(user){
			
				var authId = user ? parseInt(Math.random().toString().substring(2), 10) : null;
				if(user){
					security.getAuthClass().put({
						id: authId,
						user: user
					},{overwrite: false});
				}
				var response = setAuthCookie(authId, user && security.getUsername(user), expires);
				response.body = user;
				return response;
			});
	}
	
	var authClass, userClass;
	var security = {
		authenticate: function(username, password){
			return when(userClass.query("username=$1", {
				parameters: [username]
			}), function(results){
				var user = first(results);
				if(!user || (user.password != password)){
					throw new AccessError("No user with the provided password");
				}
				return user;
			});
		},
		createUser: function(username, password){
			return when(userClass.query("username=$1", {
				parameters: [username]
			}), function(results){
				var user = first(results);
				if(user){
					throw new AccessError("User already exists");
				}
				return security.getUserClass().put({
						username: username,
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
			
			return [];
		},
		getUsername: function(user){
			return user && (user.username || user.name) || user;
		},
		getAuthClass: function(){
			var Class = require("perstore/model").Model;
			if(!authClass){
				authClass = Class("Auth",{});
			}
			return authClass;
		},
		setAuthClass: function(value){
			authClass = value;
		},
		getUserClass: function(){
			var Class = require("perstore/model").Model;
			if(!userClass){
				userClass = Class("User", exports.userSchema);
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
	},
	quality: 0.1
});
exports.ReadOnly = ReadOnly;
*/
