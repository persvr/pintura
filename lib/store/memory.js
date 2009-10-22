/**
 * An in-memory store.
 */
var jsonQuery = require("json-query").jsonQuery;
exports.Memory = function(options){
	var index = (options && options.index) || {};
	return {
		get: function(id){
			return index[id];
		},
		put: function(object, id){
			id = id || Math.random().toString().substring(2);
			index[id] = object;
			return id;
		},
		query: function(query, options){
			options = options || {};
			var all = [];
			for(var i in index){
				all.push(index[i]);
			}
			if(!query){
				return all;
			}
			var args = [query, all].concat(options.parameters || []); 
			return jsonQuery.apply(null, args);
		},
		"delete": function(id){
			delete index[id]; 
		}
	};
};