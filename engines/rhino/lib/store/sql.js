/**
 * This is an SQL store for Rhino (and needs to be moved to engines/rhino/lib)
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

exports.nameValueToSQL = function(query, options){
};