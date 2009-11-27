/**
 * Registers the text/uri-list media type (just line delimited data)
 * This is useful for Comet requests that need to list URIs to subscribe to
 */
var Media = require("../media").Media;

Media({
	mediaType:"text/uri-list",
	getQuality: function(object){
		return 0.05;
	},
	serialize: function(object, request, response){
		return {
			forEach: function(write){
				object.forEach(function(item){
					write(item);
					write("\r\n");
				});
			}
		}
	},
	deserialize: function(inputStream, request){
		return inputStream.read().decodeToString("UTF-8").split(/\r?\n/g);
	}
});