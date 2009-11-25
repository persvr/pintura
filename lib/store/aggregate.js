/**
*An aggregate store can combine multiple stores, where each store holds different parts of the data 
*/
exports.Aggregate = function(stores, properties){
	var store = {
		split: function(object){
			// splits an object into different objects for each store
			var objects = [];
			for(var i = 0; i < stores.length; i++){
				var propertyNames = properties[i];
				if(propertyNames){
					var part = {};
					for(var i = 0; i < propertyNames.length; i++){
						var propertyName = propertyNames[i];
						if(propertyName in object){
							part[propertyName] = object[propertyName];
						}
						objects.push(part);	
					}
				}
				else{
					objects.push(object);
				}
			}
		},

		combine: function(objects){
			var combined= {};
			objects.forEach(function(object){
				for(var i in object){
					combined[i] = object;
				}
			});
			return combined;
		},
		get: function(id){
			return this.combine(stores.map(function(store){
				return store.get(id);
			}));
		},
		query: function(query, options){
			// default query just pulls from the first store (and just uses aggregation for gets)
			return stores[0].query(query, options);
		},
		put: function(object, id){
			var objects = this.split(object);
			for(var i = 0; i < objects.length; i++){
				id = stores[i].put(objects[i], id) || id;
			}
			return id;
		}
		
	}
	["subscribe", "delete", "startTransaction", "commitTransaction", "abortTransaction"].forEach(function(methodName){
		store[methodName] =  function(){
			var returned, args = arguments;
			stores.forEach(function(eachStore){
				returned = eachStore[methodName] && eachStore[methodName].apply(eachStore, args) || returned;
			});
			return returned;
		};
	});
	return store;
};