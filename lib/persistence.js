pintura.getDataLoader(env).get(id) or .query(query)

pintura.facetedDataInterface = pintura.dataInterface(Facet);
var OtherPersistable = pintura.dataInterface.transactionFor(env);
var SomePersistable = pintura.dataInterface.transactionFor(env).forTable(tableName);
var obj = SomePersistable.get(id);
new SomePersistable();
SomePersistable.set(obj, 3);
obj.foo = 3;
SomePersistable.get(obj);
SomePersistable.save(obj);

var stores = {};
var schemas = {};

pintura.dataInterface = function(Facet){
	return {
		transactionFor: function(env){
			function Transaction(){
				
			}
			var facet;
			Object.copy({
				forTable: function(table){
					facet = Facet.facetFor(env, table);
				},
				get: function(idOrInstance, name){
					if(typeof idOrInstance == "object"){
						var propDef = schemaProperties[name];
						if(propDef){
							if(propDef.hidden){
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
				
			}, Persistable);
			return Persistable;
		}
	}
} 
persvr.registerTable = function(name, store, schema){
	stores[name] = store;
	schemas[name] = schema;
};

persvr.getClass = function(){
	
};
persvr.getInterface = function(){
	
};

SomePersistable
pintura.dataLoader.forEnv(env).getTable(tableName)
Facet.facetOf