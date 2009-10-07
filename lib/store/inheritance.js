/**
 * This provides inheritance between stores
 */
exports.Inheritance = function(schema, store){
	var subTypesFor = {};
	subTypesFor[schema["extends"].name].push(this);
	query: function(query){
		var results = store.query(query);
		var subTypes = subTypesFor[name];
		for(var i = 0; i < subTypes.length; i++){
			results.concat(subTypes[i].query(query));
		}
	}
	return CacheStore({
	startTansaction: function(){
		return {
			get: function(id){
				// never return anything that isn't cached
			},
			save: function(){
				// don't do anything, just keep it in memory
			},
			query: function(){
				throw new Error("All queries to the in-memory store should be done through JSONQuery");
			},
			create: function(object, id){
			},
			remove: function(id){
			}
			
		};
	}
},options);
};


startTransaction().getStore(