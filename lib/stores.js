/**
 * This is manager for the interaction between faceted data in the form of JavaScript
 * objects and the underlying data stores. 
 */

var stores = {};
var schemas = {};


exports.registerStore = function(name, store, schema){
	stores[name] = store;
	schemas[name] = schema;
};

exports.transaction = function(executor){	
	executor({
		getEntityStore: function(storeName){
			return stores[storeName];
		}
	});
}

exports.getClass = function(){
	
};

exports.registerStore("Class", require("./store/memory").memory, {});