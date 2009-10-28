/**
 * Registers URLEncoded media type handling
 */
var JSONExt = require("../json-ext"),
	Media = require("../media").Media;

Media({
	mediaType:"application/x-www-form-urlencoded",
	getQuality: function(object){
		return 0.1;
	},
	serialize: function(object, env, response){
		// don't know why anyone would ever serialize to urlencoded
		var serialization = [];
		for(var i in object){
			if(object.hasOwnProperty(i)){
				serialization.push(encodeURIComponent(i) + "=" + encodeURIComponent(object[i]));
			}
		}
		return [serialization.join("&")];
	},
	deserialize: function(inputStream, env){
		var body = inputStream.read().decodeToString("UTF-8");
		if(body.charAt(0) == "{" || body.charAt(0) == "["){
			print("A content type of application/x-www-form-urlencoded was specified, but the content appears to be JSON, and will be parsed as JSON");
			return JSONExt.parse(body);
		}
		parts = body.split("&");
		var props = {};
		for(var i = 0; i < parts.length; i++){
			var nameValue = parts[i].split("=");
			var value = decodeURIComponent(nameValue[1]);
			var key = decodeURIComponent(nameValue[0]);
			props[key] = value; 
		}
		return props;
				
	}
});