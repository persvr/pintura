/**
 * This is manager for the interaction between faceted data in the form of JavaScript
 * objects and the underlying data stores. 
 */

var stores = {};
var storesForDefault = {};
var schemas = {};
var defaultDatabase = {
	transaction: function(executor){
		var usedStores = [];
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
		for(var i = 0; i < usedStores.length; i++){
			var usedStore = usedStores[i];
			if(usedStore.commitTransaction){
				usedStore.commitTransaction();
			}
		}
		return result;
	}
}
var SchemaFacet = require("facet").SchemaFacet;
exports.registerStore = function(name, store, schema){
	storesForDefault[name] = store;
	store.name = name;
	stores[name] = defaultDatabase;
	if(typeof schema !== "function"){ 
		schema = SchemaFacet(schema);
	}
	schemas[name] = schema;
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
						print("storeName" + storeName);
						return transactions[stores[storeName].name].getEntityStore(storeName);
					}
				});
			}
		});	
	}
	return doTransaction(defaultDatabase);
}

exports.transaction = function(executor){
	rawTransaction(function(transaction){
		var wrappedTransaction = {
			getEntityStore: function(storeName){
				return schemas[storeName](transaction.getEntityStore(storeName), wrappedTransaction);
			}
		};
		return executor(wrappedTransaction);
	});
};

exports.registerStore("Class", require("./store/memory").Memory({}));