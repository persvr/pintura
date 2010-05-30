/**
 * Registers plain text media type handling
 */
var Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString,
	print = require("system").print,
	JSONExt = require("commonjs-utils/json-ext");

Media({
	mediaType: "text/plain",
	getQuality: function(object){
		return 0.1;
	},
	serialize: function(object, request, response){
		return {
			forEach: function(write){
				return object.forEach(function(item){
					var array = [];
					for (var i in item) if (item.hasOwnProperty(i)) {
						array.push(item[i]);
					}
					write(array.join("\t") + "\n");
				});
			}
		};
	},
	deserialize: function(inputStream, request){
		var body = forEachableToString(inputStream);
		if(body.charAt(0) == "{" || body.charAt(0) == "["){
			print("A content type of text/plain was specified, but the content appears to be JSON, and will be parsed as JSON");
			return JSONExt.parse(body);
		}
		return body;
	}
});
