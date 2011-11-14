/**
 * Registers plain text media type handling
 */
var Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString,
	when = require("promised-io/promise").when,
	getColumnsToExport = require("../media").getColumnsToExport,
	print = require("promised-io/process").print,
	JSONExt = require("perstore/util/json-ext");

Media({
	mediaType: "text/plain",
	getQuality: function(object){
		return 0.1;
	},
	delimiter: "\t",
	serialize: function(object, parameters, request){
		var self = this;
		var columns;
		return {
			forEach: function(write){
				return object.forEach(function(item){
					// the very first item determines the columns to be exported
					if (!columns) {
						columns = getColumnsToExport(request, item);
					}
					var str = item;
					if (typeof item === "object") {
						var array = [];
						columns.forEach(function(i){
							array.push(item[i]);
						});
						str = array.join(self.delimiter);
					}
					write(str);
					write("\n");
				});
			}
		};
	},
	deserialize: function(inputStream){
		return when(forEachableToString(inputStream), function(body){
			if(body.charAt(0) == "{" || body.charAt(0) == "["){
				print("A content type of text/plain was specified, but the content appears to be JSON, and will be parsed as JSON");
				return JSONExt.parse(body);
			}
			return body;
		});
	}
});
