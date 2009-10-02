/**
 * Worker that maintains all authentications for cookies
 */
require("json-rpc-worker").server(exports);

var userAuths = {};
exports.getAuth = function(id){
	return userAuths[id];
};