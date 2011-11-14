/**
 * Registers URLEncoded media type handling
 */
var JSONExt = require("perstore/util/json-ext"),
	stringToValue = require("./auto-type").stringToValue,
	print = require("promised-io/process").print,
	when = require("promised-io/promise").when,
	Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString;


Media({
	mediaType:"application/x-www-form-urlencoded",
	getQuality: function(object){
		return 0.1;
	},
	serialize: function(object){
		// don't know why anyone would ever serialize to urlencoded
		var serialization = [];
		for(var i in object){
			if(object.hasOwnProperty(i)){
				serialization.push(encodeURIComponent(i) + "=" + encodeURIComponent(object[i]));
			}
		}
		return [serialization.join("&")];
	},
	deserialize: function(inputStream){
		return when(forEachableToString(inputStream), function(body){
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
				value = stringToValue(value);
				// N.B. multiple same-named keys should be stored as an array
				if (props[key] !== undefined) {
					if (!(props[key] instanceof Array))
						props[key] = [props[key]];
					props[key].push(value);
				} else {
					props[key] = value;
				}
			}
			return props;
		});
	}
});
