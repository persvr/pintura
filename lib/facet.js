/**
 * This provides the facet-based programming model for pintura, allowing for different
 * views or forms of accessing the underlying data stores. Different facets can be used
 * for different application access points, different security levels, and different locales. 
 */
var Facet = exports.Facet = function(facet){
	Facet.instances.push(facet);
}

var ForEachWrapper = require("util/lazy").ForEachWrapper;
Facet.instances = [];
Facet.facetFor = function(env, table){
	var schema = env.HTTP_ACCEPT.match(/schema=(.*)/)[1];
	return Facet.instances.filter(function(facet){
		return facet.id == schema;
	})[0];
};

function FacetedStore(store, facetResolver){
	function constructor(){
		return constructor.put.apply(this,arguments);
	}
	constructor.query= function(query, options){
		var storeResults = store.query(query, options);
		var results = new ForEachWrapper({
			forEach: function(callback){
				storeResults.forEach(function(item){
					callback(constructor.wrap(item));
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
		if(id.match(/\?|\[/)){
			return store.query(id,{});
		}
		return this.wrap(store.get(id));
	};
	constructor.put= function(instance){
		instance.save(); // the instance has to do the save since it actually has the reference to the source object
	};
	constructor["delete"] = function(instance){
		store["delete"](instance);
	};
	constructor.wrap = function(instance){
		throw new Error("wrap must be implemented in FacetedStore implementations");
	}
	constructor.post = function(props, id){
		return this.wrap(store.put(props, id));
	};
	
	return constructor;
}

var checkPropertyChange = require("schema").checkPropertyChange;
var mustBeValid = require("schema").mustBeValid;
var validate = require("schema").validate;
var SchemaControlled = function(facetSchema, sourceClass){
	var properties = facetSchema.properties;
	var links = {};
	for(var i in properties){
		if(properties[i].link){
			links[properties[i].link] = i;
		}
	}
	var wrap = function(source){
		if(!facetSchema.allowed(source)){
			throw new AccessError("Access denied to " + source);
		}
		var wrapped = Object.create(Object.create(facetSchema.prototype,{
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
					sourceClass.save(source);
				},
				enumerable: false
			},
			load: {
				value: function(){
					var id = this.$ref || this.id;
					if(id){
						
					}
				},
				enumerable: false
			}
		}));
		
		
		for(var i in source){
			if(source.hasOwnProperty(i)){
				var propDef = properties && properties[i];
				if(!(propDef && propDef.blocked)){
					if(propDef && propDef.get){
						wrapped[i] = propDef.get.call(source, i);
					}
					else{
						wrapped[i] = source[i];
					}
				}
			}
		}
		return wrap;	
	}
	
}


exports.SchemaFacet = function(facetSchema){
	return Facet(function(sourceClass){
			if(facetSchema.appliesTo && sourceClass != schema.appliesTo){//TODO: go up inheritance chain
				throw new TypeError("facet can not be applied to " + clazz);	
			}
			var facetedStore = FacetedStore(sourceClass);
			 
			copy(copy(typeof facetSchema == "function" ? facetSchema(sourceClass) : facetSchema, {
						wrap: SchemaControlled(facetSchema, sourceClass)
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