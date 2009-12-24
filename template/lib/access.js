/**
 * Defines the capabilities of different users
 */
var admins = require("settings").admins,
	Register = require("security").Register,
	security = require("pintura").config.security;

security.getAllowedFacets = function(user, request){
	if(user){
		if(admins.indexOf(user.name)>-1){
			return [/*Define the capabilities of the admin*/];
		}
		return [/*Define the capabilities of a normal user*/];
	}
	return [Register];
};
