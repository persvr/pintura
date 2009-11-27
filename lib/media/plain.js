/**
 * Registers plain text media type handling
 */
var Media = require("../media").Media;

Media({
	mediaType:"text/plain",
	getQuality: function(object){
		return 0.1;
	},
	serialize: function(object, request, response){
		return ['' + object];
	},
	deserialize: function(inputStream, request){
		return inputStream.read().decodeToString("UTF-8");
	}
});