/**
 * Registers Atom media type handling
 */
var Media = require("../media").Media;

Media({
	mediaType:"text/csv",
	getQuality: function(object){
		return 0.4;
	},
	serialize: function(object, env, response){
		return {
			forEach: function(write){
				var store = env.store;
				var items = object.items;
				for (var i =0; i < items.length; i++){
					var item = items[i];
					var array = [];
					if(i == 0){
						for(var j in item){
							array.push(j);
						}
						write(array.join(",") + "\n");
						var array = [];
					}
					for(var j in item){
						array.push(item[j]);
					}
					write(array.join(",") + "\n");
				}
			}
		};
	},
	deserialize: function(inputStream, env){
		var lines = inputStream.read().decodeToString("UTF-8").split("\n");
		var columns;
		var items = lines.map(function(line){
			var values = line.split(",");
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