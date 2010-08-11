/**
 * Registers the text/uri-list media type (just line delimited data)
 * This is useful for Comet requests that need to list URIs to subscribe to
 */
var Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString;


Media({
	mediaType:"text/uri-list",
	getQuality: function(object){
		return 0.05;
	},
	serialize: function(object){
		return {
			forEach: function(write){
				object.forEach(function(item){
					write(item);
					write("\r\n");
				});
			}
		}
	},
	deserialize: function(inputStream){
		return forEachableToString(inputStream).split(/\r?\n/g);
	}
});