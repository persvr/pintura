/**
 * This is manager for the interaction between faceted data in the form of JavaScript
 * objects and the underlying data stores. 
 */

var stores = {};
var storesForDefault = {};
var schemas = {};
var classes = {};
var currentTransaction;
var defaultDatabase = {
	transaction: function(executor){
		var success, usedStore, usedStores = [];
		try{
			var result = executor({
				getEntityStore: function(storeName){
					var store = storesForDefault[storeName];
					if(usedStores.indexOf(store) == -1){			
						usedStores.push(store);
						if(store.startTransaction){
							store.startTransaction();
						}
					}
					return store;
				}
			});
			while(usedStore = usedStores.shift()){
				if(usedStore.commitTransaction){
					usedStore.commitTransaction();
				}
			}
			success = true;
		}
		finally{
			// basically catch, abort, and rethrow 
			if(!success){
				while(usedStore = usedStores.shift()){
					if(usedStore.abortTransaction){
						usedStore.abortTransaction();
					}
				}
			}
		}		
		return result;
	}
};
var DatabaseError = require("./errors").DatabaseError,
	NotFoundError = require("./errors").NotFoundError,
	Permissive = require("./facet").Permissive;
exports.registerStore = function(name, store, schema){
	schema = schema || (store.getSchema ? store.getSchema() : {});
	storesForDefault[name] = store;
	store.name = name;
	if(!store.create){
		// map create to put in case it only implements the WebSimpleDB API
		store.create = store.put;
	}
	stores[name] = defaultDatabase;
	schema.id = name;
	schemas[name] = schema;
	if(typeof schema !== "function"){ 
		schema = Permissive(store, schema);
	}
	schema.id = name;
	Object.defineProperty(schema, "transaction", {
		get: function(){
			return currentTransaction;
		}
	});
	classes[name] = schema;
	return schema;
};
exports.registerDatabase = function(database, storeNames){
	var previousDatabase = defaultDatabase;
	while(previousDatabase.nextDatabase){
		previousDatabase = previousDatabase.nextDatabase
	}
	previousDatabase.nextDatabase = database;
	storeNames.forEach(function(name){
		stores[name] = database;
	});
		
};


var rawTransaction = exports.rawTransaction = function(executor){
	var transactions = {};
	function doTransaction(database){
		database.transaction(function(transaction){
			transactions[database.id] = transaction;
			if(database.nextDatabase){
				return doTransaction(database.nextDatabase);
			}
			else{
				return executor({
					getEntityStore: function(storeName){
						var store = stores[storeName];
						if(!store){
							throw new NotFoundError(storeName + " not found");
						}
						return transactions[store.name].getEntityStore(storeName);
					}
				});
			}
		});	
	}
	return doTransaction(defaultDatabase);
}

exports.transaction = function(executor){
	rawTransaction(function(transaction){
		currentTransaction = {
			getEntityStore: function(storeName){
				transaction.getEntityStore(storeName); // start the transaction
				return classes[storeName];
			}
		};
		return executor(currentTransaction);
	});
};

exports.classSchema = {};
exports.classClass = exports.registerStore("Class", require("./store/memory").Memory({index: schemas}), exports.classSchema);