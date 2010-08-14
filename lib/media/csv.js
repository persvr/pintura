/**
 * Registers CSV media type handling
 * http://en.wikipedia.org/wiki/Comma-separated_values
 */
var Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString,
	getColumnsToExport = require("../media").getColumnsToExport;

Media({
	mediaType: "text/csv",
	getQuality: function(object){
		return 0.4;
	},
	delimiter: ",", // E.g. in Europe they use ';' as CSV delimiter
	serialize: function(object, parameters, request, response){
		var self = this;
		var columns; // N.B. in case of empty object we can never dump column list ;)
		return {
			forEach: function(write){
				object.forEach(function(item){
					// the very first item determines the columns to be exported
					if (!columns) {
						columns = getColumnsToExport(request, item);
						// write columns headers
						write(columns.join(this.delimiter) + "\n");
					}
					var str = item;
					if (typeof item === "object") {
						var array = [];
						columns.forEach(function(i){
							var s = item[i];
							// if a field's value contains a double quote character it is escaped by placing another double quote character next to it
							s = s.replace(/"/g, '""');
							// fields that contain a special character (comma, newline, or double quote), must be enclosed in double quotes
							if (s.indexOf(this.delimiter) >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0)
								s = '"' + s + '"';
							array.push(s);
						});
						str = array.join(this.delimiter);
					}
					// if a line contains a single entry which is the empty string, it may be enclosed in double quotes
					if (!str)
						str = '""';
					write(str);
					write("\n");
				});
			}
		};
	},
	// TODO: http://github.com/voodootikigod/node-csv/blob/master/lib/csv.js
	deserialize: function(inputStream, request){
		// TODO: "It is noteworthy to say that many applications will not handle a line break within a cell as in the example above.
		// Such applications may interpret the line break as a delimiter and call for a new cell to begin.
		// In this case, the layout of the CSV file will be disrupted or broken"
		var lines = forEachableToString(inputStream).split("\n");
		var columns;
		var items = lines.map(function(line){
			var values = line.split(this.delimiter);
			if(!columns){
				columns = values;
			}
			else{
				var object = {};
				for(var i = 0; i < values.length; i++){
					object[columns[i]] = values[i];
				}
				return object;
			}
		});
		items.shift(0);
		return {items:items};
	}
});
