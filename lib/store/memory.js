/**
 * An in-memory store.
 */
var jsonQuery = require("../json-query").jsonQuery;
exports.Memory = function(options){
	return {
		index: (options && options.index) || {},
		get: function(id){
			return this.index[id];
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
			return jsonQuery.apply(null, args);
		},
		"delete": function(id){
			delete this.index[id]; 
		}
	};
};