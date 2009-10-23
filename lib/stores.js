/**
 * This is manager for the interaction between faceted data in the form of JavaScript
 * objects and the underlying data stores. 
 */

var stores = {};
var storesForDefault = {};
var schemas = {};
var classes = {};
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
}
var DatabaseError = exports.DatabaseError = function(code,message){
	Error.call(this, message);
	this.message = message;
	this.name = "DatabaseError";
	this.code = code;
};
DatabaseError.prototype = new Error();

var NotFoundError = exports.NotFoundError = function(message){
	DatabaseError.call(this, 3, message);
	this.name = "NotFoundError";
};
NotFoundError.prototype = new DatabaseError();

var SchemaFacet = require("facet").SchemaFacet;
exports.registerStore = function(name, store, schema){
	schema = schema || (store.getSchema ? store.getSchema() : {});
	schema.appliesTo = store;
	storesForDefault[name] = store;
	store.name = name;
	stores[name] = defaultDatabase;
	schema.id = name;
	schemas[name] = schema;
	if(typeof schema !== "function"){ 
		schema = SchemaFacet(schema);
	}
	schema.id = name;
	classes[name] = schema;
	return store;
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
				return classes[storeName].forStore(transaction.getEntityStore(storeName), wrappedTransaction);
			}
		};
		return executor(wrappedTransaction);
	});
};

exports.classSchema = {};
exports.registerStore("Class", require("./store/memory").Memory({index: schemas}), exports.classSchema);