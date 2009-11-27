/**
 * Registers CSS media type
 */
var Media = require("../media").Media;

Media({
	mediaType:"text/css",
	getQuality: function(object){
		return 0.2;
	},
	serialize: function(object, request, response){
		return {
			forEach: function(write){
				object.forEach(function(item){
					write(item.selectorText);
					write(" {\n");
					write(item.cssText);
					write("\n}\n");
				});
			}
		}
	},
	deserialize: function(inputStream, request){
		throw new Error("not implemented yet");
	}
});