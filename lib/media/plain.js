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
	fields: undefined, // array of fields to export
	serialize: function(object, request, response){
		var self = this;
		return {
			forEach: function(write){
				var columns;
				return object.forEach(function(item){
					if (!columns) {
						columns = [];
						if (self.fields) {
							self.fields.forEach(function(f){
								if (item.hasOwnProperty(f))
									columns.push(f);
							});
						} else {
							for (var i in item) if (item.hasOwnProperty(i)) {
								columns.push(i);
							}
						}
					}
					var array = [];
					columns.forEach(function(i){
							array.push(item[i]);
					});
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
