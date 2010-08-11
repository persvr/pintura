/**
 * Registers message/http, which allows multiple HTTP messages to be sent
 * in one request (effectively facilitating multi-action transactions)
 * not implemented yet
 * TODO: Move to a facet, like facet/jsgi.js
 */
var Media = require("../media").Media;

Media({
	mediaType:"message/http",
	getQuality: function(object){
		return 0.6;
	},
	serialize: function(object, parameters, request, response){
		throw new Error("not implemented yet");
	},
	deserialize: function(inputStream, parameters, request){
		throw new Error("not implemented yet");
	}
});