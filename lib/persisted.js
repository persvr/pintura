var Permissive = require("./facet").Permissive;

var stores = require("./stores"),
	DefaultStore = stores.DefaultStore,
	registerStore = stores.registerStore,
	defineProperty = require("./util/es5-helper").defineProperty;
exports.Store = function(name, store){
	exports.Class(name, store,  {});//(store.getSchema ? store.getSchema() : {});
}
var schemas = {};
exports.Class = function(name, store, schema){
	if(!schema){
		schema = store;
		store = null;
		
	}
	if(!store){
		store= new DefaultStore(name);
	}
	schema.id = name;
	schemas[name] = schema;
	if(typeof schema !== "function"){ 
		schema = Permissive(store, schema);
	}
	schema.id = name;
	defineProperty(schema, "transaction", {
		get: function(){
			return stores.currentTransaction;
		}
	});
	return registerStore(name, store, schema);
};

exports.classSchema = {};
exports.classClass = exports.Class("Class", require("./store/memory").Memory({index: schemas}), exports.classSchema);