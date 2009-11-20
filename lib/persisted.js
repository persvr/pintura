var JSFile = require("./store/js-file").JSFile,
	Permissive = require("./facet").Permissive,
	DATA_FOLDER = require("settings").DATA_FOLDER;

exports.DefaultStoreConstructor = function(name){
	return JSFile((DATA_FOLDER || "data") + "/" + name);
};
var stores = require("./stores");
var registerStore = stores.registerStore;
exports.Store = function(name, store){
	exports.Class(name, store,  {});//(store.getSchema ? store.getSchema() : {});
}
var schemas = {};
exports.Class = function(name, store, schema){
	if(!schema){
		schema = store;
		store= new exports.DefaultStoreConstructor(name);
	}
	schema.id = name;
	schemas[name] = schema;
	if(typeof schema !== "function"){ 
		schema = Permissive(store, schema);
	}
	schema.id = name;
	Object.defineProperty(schema, "transaction", {
		get: function(){
			return stores.currentTransaction;
		}
	});
	return registerStore(name, store, schema);
};

exports.classSchema = {};
exports.classClass = exports.Class("Class", require("./store/memory").Memory({index: schemas}), exports.classSchema);