/**
 * Provides the default mechanism for Pintura's security system.
 */
 

var SchemaFacet = require("facet").SchemaFacet;
try{
	var uuid = require("uuid");
}catch(e){
	
}
exports.userSchema = {};
var setAuthCookie = require("jsgi/auth").setAuthCookie;
var registerClass = require("data").registerClass;

exports.DefaultSecurity = function(){
	// allow JSON-RPC authentication
	exports.userSchema.authenticate = function(username, password, expires){
		var user = security.authenticate(username, password);
	
		var authId = parseInt(Math.random().toString().substring(2), 10);
		authStore.startTransaction();
		authStore.put({
			id: authId,
			user: user
		});
		authStore.commitTransaction();
		var response = setAuthCookie(authId, security.getUsername(user), expires);
		response.body = user;
		return response;
	}
	var authStore, userStore;
	var security = {
		authenticate: function(username, password){
			return username;
			var user = userStore.query("?username=$1", {
				parameters: [username]
			})[0];
			if(!user || (user.password != password)){
				throw new AccessError("No user with the provided password");
			}
		},
		createUser: function(username, password){
			
		},
		belongsToRole: function(user, role){
			if(role == "write"){
				return true;//user == "kris";
			}
			if(role == "read"){
				return user;
			}
		},
		getUsername: function(user){
			return user && user.name || user;
		},
		get authStore(){
			if(!authStore){
				authStore = registerClass("Auth",{});
			}
			return authStore;
		},
		set authStore(value){
			authStore = value;
		},
		get userStore(){
			if(!userStore){
				userStore = registerClass("User", exports.userSchema);
			}
			return userStore;
		},
		set userStore(value){
			userStore = value;
		}
	};
	return security;
};


var AccessError = exports.AccessError =function(message){
	var error = Error.apply(this, arguments);
	this.message = message;
	this.name = "AccessError";
	return this;
};
AccessError.prototype = new Error;

var Facet = require("facet").Facet;
var FullAccess = exports.FullAccess = Facet(function(store){
	return store;
});
FullAccess.forStore = function(store){
	return store;
}
FullAccess.allowed = function(request){
	return request.security.belongsToRole(request.authenticatedUser, "write");
};
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
	},*/
	

var ReadOnly = new SchemaFacet({
	appliesTo: Object,
	allowed: function(request, object){
		return request.security.belongsToRole(request.authenticatedUser, "read");
	},
	additionalProperties:{
		readonly: true
	},
	quality: 0.1
});
ReadOnly.quality = 0.2;