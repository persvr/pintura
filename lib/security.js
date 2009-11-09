/**
 * Provides the default mechanism for Pintura's security system.
 */
 
var AccessError = require("./errors").AccessError;

try{
	var uuid = require("./uuid");
}catch(e){
	
}
exports.userSchema = {};
var setAuthCookie = require("./jsgi/auth").setAuthCookie;


exports.DefaultSecurity = function(){
	// allow JSON-RPC authentication
	var Class = require("./stores").classClass;
	exports.Authenticate = Restrictive(Class, {
		prototype:{
			authenticate: function(source, username, password, expires){
				return authenticate(username, password, expires);
			}
		},
		quality: 0.1
	});
	
	function authenticate(username, password, expires){
		var user = security.authenticate(username, password);
	
		var authId = user ? parseInt(Math.random().toString().substring(2), 10) : null;
		if(user){
			authClass.create({
				id: authId,
				user: user
			});
		}
		var response = setAuthCookie(authId, user && security.getUsername(user), expires);
		response.body = user;
		return response;
	}
	
	var authClass, userClass;
	var security = {
		authenticate: function(username, password){
			var user = userClass.query("?username=$1", {
				parameters: [username]
			})[0];
			if(!user || (user.password != password)){
				throw new AccessError("No user with the provided password");
			}
		},
		createUser: function(username, password){
			
		},
		getAllowedFacets: function(user, request){
			// make it easy to get going, but all apps will obviously want to override this
			// there is also a ReadOnly facet that is useful
			return [FullAccess];
		},
		getUsername: function(user){
			return user && user.name || user;
		},
		get authClass(){
			var Class = require("./persistence").Class;
			if(!authClass){
				authClass = Class("Auth",{});
			}
			return authClass;
		},
		set authClass(value){
			authClass = value;
		},
		get userClass(){
			var Class = require("./persistence").Class;
			if(!userClass){
				userClass = Class("User", exports.userSchema);
			}
			return userClass;
		},
		set userClass(value){
			userClass = value;
		}
	};
	exports.userSchema.authenticate = authenticate;
	
	return security;
};



var Facet = require("./facet").Facet,
	Restrictive = require("./facet").Restrictive;

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
		return true;//env.authenticatedUser.name == "admin";
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