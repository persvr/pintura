/**
 * Provides the default mechanism for Pintura's security system.
 */
var SchemaFacet = require("facet").SchemaFacet; 
exports.DefaultSecurity = function(UserClass){
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
			
		}
	}
};



var AccessError = exports.AccessError =function(){
	var error = Error.apply(this, arguments);
	error.name = "AccessError";
	return error;
};
AccessError.prototype = new Error;


var FullAccess = exports.FullAccess = SchemaFacet({
	appliesTo: Object,
	allowed: function(object, env){
		return true;//env.authenticatedUser.name == "admin";
	},
/*	load: function(object, source){
		return object;
	},
	update: function(object, source){
		return source;
	},*/
	
});
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