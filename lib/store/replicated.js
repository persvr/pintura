/**
*Takes two stores and writes to both. Events in one then trigger writes in the other 
*/
exports.Replicated = function(primary, replicate, options){
	options = options || {};
	var store = Object.create(primary);
	store.create= function(object){
		var id = primary.create(object);
		replicate.put(object); // do a PUT because we require an exact replica
		return id;
	};
	["put", "delete", "subscribe", "startTransaction", "commitTransaction", "abortTransaction"].forEach(function(methodName){
		store[methodName] = options.replicateFirst ? 
		function(){
			var returned = replicate[methodName] && replicate[methodName].apply(primary, arguments);
			primary[methodName] && primary[methodName].apply(primary, arguments);
			return returned;
		} :
		function(){
			var returned = primary[methodName] && primary[methodName].apply(primary, arguments);
			replicate[methodName] && replicate[methodName].apply(primary, arguments);
			return returned;
		}
	});
	if(replicate.subscribe){
		replicate.subscribe("", function(action){
			primary[action.event](action.body);
		});
	}
	return store;
};