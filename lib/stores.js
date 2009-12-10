/**
 * This is manager for the interaction between faceted data in the form of JavaScript
 * objects and the underlying data stores. 
 */
 
exports.DefaultStore = function(name){
	return JSFile((require("settings").dataFolder || "data") + "/" + name);
};

var stores = {};
var storesForDefault = {};
var schemas = {};
var classes = {};
var defaultDatabase = {
	transaction: function(executor){
		var success, usedStore, usedStores = [];
		return executor({
			getEntityStore: function(storeName){
				var store = storesForDefault[storeName];
				return store;
			}
		});
	},
	id:0
};
var DatabaseError = require("./errors").DatabaseError,
	NotFoundError = require("./errors").NotFoundError;
	
exports.registerStore = function(name, store, schema){
	schema = schema || {};//(store.getSchema ? store.getSchema() : {});
	storesForDefault[name] = store;
	store.id = name;
	if(!store.create){
		// map create to put in case it only implements the WebSimpleDB API
		store.create = store.put;
	}
	stores[name] = defaultDatabase;
	classes[name] = schema;
	return schema;
};
var nextDatabaseId = 1;
exports.registerDatabase = function(database, storeNames){
	var previousDatabase = defaultDatabase;
	while(previousDatabase.nextDatabase){
		previousDatabase = previousDatabase.nextDatabase
	}
	previousDatabase.nextDatabase = database;
	if(storeNames){
		storeNames.forEach(function(name){
			stores[name] = database;
		});
	}
	database.id = nextDatabaseId++; 
};

var transactions = {};
var rawTransaction = exports.rawTransaction = function(executor){
	
	function doTransaction(database){
		return database.transaction(function(transaction){
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
						return transactions[database.id].getEntityStore(storeName);
					}
				});
			}
		});	
	}
	return doTransaction(defaultDatabase);
}
var currentRawTransaction;
exports.transaction = function(executor){
	return rawTransaction(function(transaction){
		var previousRawTransaction = currentRawTransaction; 
		currentRawTransaction = transaction;
		var previousTransaction = exports.currentTransaction;
		var currentTransaction = exports.currentTransaction = {
			getEntityStore: function(storeName){
				//transaction.getEntityStore(storeName); // start the transaction
				var store = classes[storeName];
				if(!store){
					throw new NotFoundError(storeName + " not found");
				}
				return store;
			}
		};
		var usedStores = currentRawTransaction.usedStores = [];
		try{
			var result = executor(currentTransaction);
			for(var i in usedStores){
				if(usedStores[i].commitTransaction){
					usedStores[i].commitTransaction();
				}
			}
			var success = true;
		}finally{
			exports.currentTransaction = previousTransaction;
			currentRawTransaction = previousRawTransaction;
			if(!success){
				for(var i in usedStores){
					if(usedStores[i].abortTransaction){
						usedStores[i].abortTransaction();
					}
				}
			}
		}
		return result;
	});
};

exports.AutoTransaction = function(store, database){
	database = database || defaultDatabase;
	for(var i in store){
		if(typeof store[i] === "function" && i != "startTransaction" && i != "commitTransaction" && i != "abortTransaction"){
			(function(i, defaultMethod){
				store[i] = function(){
					if(currentRawTransaction){
						var currentTransactionStore = currentRawTransaction.usedStores[store.id];
						database.currentTransaction = transactions[database.id];
						if(!currentTransactionStore){
							currentTransactionStore = currentRawTransaction.usedStores[store.id] = store;//currentRawTransaction.getEntityStore(store.id);
							if(currentTransactionStore.startTransaction){
								currentTransactionStore.startTransaction();
							}
						}
						return defaultMethod.apply(currentTransactionStore, arguments);
					}
					else{
						var args = arguments;
						return exports.transaction(function(trans){
							// go through it again, with a currentTransaction in place
							return store[i].apply(store, args);
						});
					}
				};
			})(i, store[i]);
		}
	}
	return store;
}

exports.classSchema = {};
exports.classClass = exports.registerStore("Class", require("./store/memory").Memory({index: schemas}), exports.classSchema);

var JSFile = require("./store/js-file").JSFile;
