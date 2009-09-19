/**
 * This is manager for the interaction between faceted data in the form of JavaScript
 * objects and the underlying data stores. 
 */

var stores = {};
var schemas = {};

exports.dataInterface = function(TableRetriever){
	return {
		transactionFor: function(env){
			var facet;
			return {
				forTable: function(table){
					facet = TableRetriever.facetFor(env).forTable(stores[table]);
				},
				get: function(idOrInstance, name){
					if(typeof idOrInstance == "object"){
						var propDef = schemaProperties[name];
						if(propDef){
							if(propDef.blocked){
								return;
							}
							if(propDef.link){
								
							}
						}
						var value = idOrInstance[name];
						if(value && value.$ref){
							return getAbsolute(value.$ref);
						}
					}
					else{
						var wrapped = facet.wrap(stores[table].get(id));
						Object.defineProperty(wrapped, "$ref", {
							value: id,
							configurable: false,
							writable: false
						});					
						// now apply JSON Schema
						return wrapped;
					}					
				},
				getAbsolute: function(id){
					var parts = id.split('/', 2);
					return forTable(parts[0]).get(id);
				},
				set: function(instance, name, value){
					
				},
				save: function(instance){
					
				},
				remove: function(instance){
					
				},
				commit: function(precondition){
					
				},
				abort: function(){
					
				},
				lock: function(instance){
					
				}
				
			};
		}
	}
};

exports.registerStore = function(name, store, schema){
	stores[name] = store;
	schemas[name] = schema;
};



exports.getClass = function(){
	
};
exports.getInterface = function(){
	
};

exports.registerStore = function("Class", 