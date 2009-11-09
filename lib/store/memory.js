/**
 * An in-memory store.
 */
var jsonQuery = require("../json-query").jsonQuery;
var extendSome = require("util/lazy").extendSome;
exports.Memory = function(options){
	return {
		index: (options && options.index) || {},
		get: function(id){
			var object = {};
			var current = this.index[id];
			for(var i in current){
				if(current.hasOwnProperty(i)){
					object[i] = current[i];
				}
			}
			return object;
		},
		put: function(object, id){
			id = id || object.id || Math.random().toString().substring(2);
			this.index[id] = object;
			return id;
		},
		query: function(query, options){
			options = options || {};
			var all = [];
			for(var i in this.index){
				all.push(this.index[i]);
			}
			if(!query){
				return all;
			}
			var args = [query, all].concat(options.parameters || []);
			var result = jsonQuery.apply(null, args); 
			return extendSome({
				some: function(callback){
					result.some(function(item){
						var object = {};
						for(var i in item){
							if(item.hasOwnProperty(i)){
								object[i] = item[i];
							}
						}
						return callback(object);
					});
				},
				length: result.length
			});
		},
		"delete": function(id){
			delete this.index[id]; 
		}
	};
};