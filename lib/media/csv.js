/**
 * Registers CSV media type handling
 * http://en.wikipedia.org/wiki/Comma-separated_values
 */
var Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString;

Media({
	mediaType: "text/csv",
	getQuality: function(object){
		return 0.4;
	},
	comma: ',', // E.g. in Europe they use ';' as delimiter
	fields: undefined, // array of fields to export
	serialize: function(object, request, response){
		var self = this;
		return {
			forEach: function(write){
				var columns; // N.B. in case of empty object we can never dump column list ;)
				object.forEach(function(item){
					var s;
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
						s = columns.join(this.comma);
						write(s + "\n");
					}
					var array = [];
					columns.forEach(function(i){
						s = item[i];
						// if a field's value contains a double quote character it is escaped by placing another double quote character next to it
						s = s.replace(/"/g, '""');
						// fields that contain a special character (comma, newline, or double quote), must be enclosed in double quotes
						if (s.indexOf(this.comma) >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0)
							s = '"' + s + '"';
						array.push(s);
					});
					s = array.join(this.comma);
					// if a line contains a single entry which is the empty string, it may be enclosed in double quotes
					if (!s)
						s = '""';
					write(s + "\n");
				});
			}
		};
	},
	deserialize: function(inputStream, request){
		// TODO: "It is noteworthy to say that many applications will not handle a line break within a cell as in the example above.
		// Such applications may interpret the line break as a delimiter and call for a new cell to begin.
		// In this case, the layout of the CSV file will be disrupted or broken"
		var lines = forEachableToString(inputStream).split("\n");
		var columns;
		var items = lines.map(function(line){
			var values = line.split(this.comma);
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
