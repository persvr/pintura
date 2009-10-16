/**
 * Provides the default mechanism for Pintura's security system.
 */
var SchemaFacet = require("facet").SchemaFacet; 
exports.DefaultSecurity = function(UserClass, AuthStore){
	return {
		authenticate: function(username, password){
			var user = UserClass.query("username=$1", username)[0];
			if(user.password != password){
				throw AccessError();
			}
				
		},
		createUser: function(username, password){
			
		},
		belongsToRole: function(user, role){
			
		},
		authStore: AuthStore
	}
};



var AccessError = exports.AccessError =function(){
	var error = Error.apply(this, arguments);
	error.name = "AccessError";
	return error;
};
AccessError.prototype = new Error;

var Facet = require("facet").Facet;
var FullAccess = exports.FullAccess = Facet(function(store){
	return store;
});
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
	

var security = require("security");
var ReadOnly = new SchemaFacet({
	appliesTo: Object,
	allowed: function(object, env){
		return security.belongsToRole(env.authenticatedUser, "read");
	},
	additionalProperties:{
		readonly: true
	}
});