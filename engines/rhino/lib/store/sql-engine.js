/**
 * This is an SQL store for Rhino
 */
var extendForEach = require("util/lazy").extendForEach;
exports.SQLStore = function(parameters){
	var adapter = new org.persvr.store.SQLStore();
	adapter.initParameters(parameters);
	return {
		startTransaction: function(){
			adapter.startTransaction();
		},
		get: function(id){
			return adapter.mapObject(id);
		},
		put: function(object, id){
			try{
				id = id || object[parameters.idColumn];
				if(id === undefined){
					throw "Not Found";
				}
				adapter.mapObject(id);
			}
			catch(e){
				return adapter.recordNewObject(object);
			}
			adapter.recordUpdate(id, object);
			
			return object;
		},
		query: function(query, options){
			return extendForEach(adapter.query(query, options));			
		},
		"delete": function(id){
			adapter.recordDelete(id);
		},
		commitTransaction: function(){
			adapter.commitTransaction();
		}
	}
}

