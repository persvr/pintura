/**
 * Registers message/http, which allows multiple HTTP messages to be sent
 * in one request (effectively facilitating multi-action transactions)
 * not implemented yet
 */
var Media = require("../media").Media;

Media({
	mediaType:"message/http",
	getQuality: function(object){
		return 0.6;
	},
	serialize: function(object, request, response){
		throw new Error("not implemented yet");
	},
	deserialize: function(inputStream, request){
		throw new Error("not implemented yet");
	}
});