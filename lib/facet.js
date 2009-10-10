/**
 * This provides the facet-based programming model for pintura, allowing for different
 * views or forms of accessing the underlying data stores. Different facets can be used
 * for different application access points, different security levels, and different locales. 
 */
var DatabaseError = require("stores").DatabaseError;
var Facet = exports.Facet = function(facet){
	Facet.instances.push(facet);
	return facet;
};


var extendForEach = require("util/lazy").extendForEach;
Facet.instances = [];
Facet.facetFor = function(store, resolver, mediaType){
	var schema = mediaType.match(/schema=(.*)/)[1];
	if(schema){
		return Facet.instances.filter(function(facet){
			return facet.id == schema;
		})[0];
	}
};
try{
	var readonlyEnforced = Object.create(Object.prototype,{test:{writable:false, value: false}});
	readonlyEnforced.test = true;
	readonlyEnforced = false;
}
catch(e){
	readonlyEnforced = true;
}
function FacetedStore(store, facetResolver){
	print("FacetedStore " + store);
	function constructor(){
		return constructor.put.apply(this,arguments);
	}
	constructor.query= function(query, options){
		var storeResults = store.query(query, options);
		var results = extendForEach({
			forEach: function(callback){
				storeResults.forEach(function(item){
					callback(constructor.prepare(item));
				});
			},
			length: storeResults.length,
		});
		results.totalCount = storeResults.totalCount;
		return results;
	};
	constructor.get = function(id){
		if(id.charAt(0) == '/'){
			
		}
		if(id.charAt(0) == '.' || id.charAt(1) == '.'){
			
		}
		if(id === '' || id.match(/\?|\[/)){
			return store.query(id,{});
		}
		return this.prepare(store.get(id));
	};
	constructor.head = function(id){
		// head just returns undefined, meaning no body
	};
	constructor.options = function(id){
		return Object.keys(constructor);
	};
	constructor.prepare = function(instance){
		throw new Error("prepare must be implemented in FacetedStore implementations");
	};
	constructor.post = function(props, id){
		if(!id){
			// create a new object
			store.put(props);
		}
		else{
			// doing an incremental update
			var target = constructor.get(id);
			for(var i in props){
				if(target[i] !== props[i]){
					if(readonlyEnforced){
						target[i] = props[i];	
					}
					else{
						target.set(i, props[i]);
					}
				}
				
			}
		}
		return target;
		
		
	};
	for(var i in store){
		if(!(i in constructor) && typeof store[i] == "function"){
			constructor[i] = store[i];
		}
	}
	return constructor;
}

var checkPropertyChange = require("schema").checkPropertyChange;
var mustBeValid = require("schema").mustBeValid;
var validate = require("schema").validate;
var writableProto = !!({}.__proto__); 
var SchemaControlled = function(facetSchema, sourceClass, facetResolver){
	var properties = facetSchema.properties;
	var idProperty = "id";
	var links = {};
	for(var i in properties){
		if(properties[i].link){
			links[properties[i].link] = i;
		}
	}
	var facetPrototype = facetSchema.prototype = facetSchema.prototype || {};
	Object.defineProperties(facetPrototype, {
			get: {
				value: function(name){
					if(links[name]){
						return facetSchema.get(this[links[name]]);
					}
					return this[name];
				},
				enumerable: false
			},
	
			set: {
				value: function(name, value){
					var propDef = properties && properties[name];
					if(propDef){
						mustBeValid(checkPropertyChange(value, propDef, name));
						if(propDef.set){
							value = propDef.set.call(this, name, value);
						}
					}
					sourceClass.get(this.id).set(name) = value;
					this[name] = value;
				},
				enumerable: false
			},
			save: {
				value: function(){
					validate(this, schema);
					for(var i in this){
						if(this.hasOwnProperty(i)){
							var propDef = properties && properties[i];
							if(!(propDef["transient"] || propDef.blocked)){
								source[i] = this[i];
							}
						}
					}
					sourceClass.save(source);
				},
				enumerable: false
			},
			load: {
				value: function(){
					if(facetSchema.allowed && !facetSchema.allowed(source, facetResolver.env)){
						throw new AccessError("Access denied to " + source);
					}
					var id = this.$ref || this.id;
					if(id){
						
					}
				},
				enumerable: false
			}
		});
	
	return function(source){
		if(!source){
			throw new DatabaseError(3, "not found");
		}
		
		if(writableProto){
			source.__proto__ = facetPrototype;
			var prepared = source;
		}
		else{
			var prepared = Object.create(facetPrototype);
			for(var i in source){
				if(source.hasOwnProperty(i)){
					var propDef = properties && properties[i];
					if(!(propDef && propDef.blocked)){
						if(propDef && propDef.get){
							prepared[i] = propDef.get.call(source, i);
						}
						else{
							prepared[i] = source[i];
						}
					}
				}
			}
			
		}
		return prepared;	
	}
	
}

exports.SchemaFacet = function(schema){
	return Facet(function(sourceStore, facetResolver){
		if(schema.appliesTo && schema.appliesTo != Object){
			superStore = sourceStore;
			while(superStore != schema.appliesTo){
				superStore = superStore["extends"];
				if(!superStore){
					throw new TypeError("facet can not be applied to " + sourceStore.name);		
				}
			}
		}
		var facetedStore = FacetedStore(sourceStore, facetResolver);
		 
		copy(copy(typeof schema == "function" ? schema(sourceStore) : schema, {
					prepare: SchemaControlled(schema, sourceStore, facetResolver)
				}), facetedStore);
		return facetedStore;
	});
};



//TODO: should branch to using Object.keys if a native version is available. The 
// native version is slightly faster than doing a for-in loop (but a simulated version
// wouldn't be). We could also have a branch for java-based copier that would 
// certainly be much faster 
function copy(source, target){
	for(var i in source){
		if(source.hasOwnProperty(i)){
			target[i] = source[i];
		}
	}
	return target;
}