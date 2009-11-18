/**
 * This provides inheritance between stores
 */
var subTypesFor = {};
exports.Inherited = function(schema, store){
	subTypesFor[schema["extends"].name].push(this);
	for(var i in store){
		inheritingStore[i] = store[i];
	} 
	inheritingStore.query= function(query){
		var results = store.query(query);
		var subTypes = subTypesFor[store.name];
		for(var i = 0; i < subTypes.length; i++){
			results.concat(subTypes[i].query(query));
		}
	};
};
