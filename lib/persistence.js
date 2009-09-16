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

pintura.dataInterface = function(Facet){
	return {
		transactionFor: function(env){
			function Transaction(){
				
			}
			
			Object.copy({
				forTable: function(table){
					
				},
				get: function(idOrInstance, name){
					
					var facet = Facet.facetOf(stores[table].get(id));
					Object.defineProperty(facet,{
						value: id,
						configurable: false,
						writable: false
					});
					// now apply JSON Schema					
				},
				set: function(instance, name, value){
					
				},
				save: function(instance){
					
				},
				remove: function(instance){
					
				},
				commit: function(precondition){
					
				},
				abort:
				lock:
				
			}, Persistable);
			return Persistable;
		}
	}
} 


pintura.Facet = function(props){
	var facetClass = function(source,env){
		if(!facetClass.allowed(source, env)){
			throw new AccessError("Access denied to " + source);
		}
		var facet = {}; 
		Object.clone(source, facet);
		return facet;
	}
	Object.copy(props, facetClass);
}
var Something = Facet({
	properties: {
		foo: String,
		bar: {hidden: true}		
	},
	allowed: function(object, env){
		return env.authenticatedUser.name == "bill";
	}
});
SomePersistable
pintura.dataLoader.forEnv(env).getTable(tableName)
Facet.facetOf