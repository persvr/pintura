/**
 * Registers plain text media type handling
 */
var 	Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString,
	JSONExt = require("commonjs-utils/json-ext");

Media({
	mediaType:"text/plain",
	getQuality: function(object){
		return 0.1;
	},
	serialize: function(object, request, response){
		return ['' + object];
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
