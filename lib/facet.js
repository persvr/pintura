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
	function constructor(){
		return constructor.put.apply(this,arguments);
	}
	constructor.query= function(query, options){
		return constructor.prepare(store.query(query, options));
	};
	constructor.get = function(id){
		id = '' + id;
		if(id.charAt(0) == '/'){
			
		}
		if(id.indexOf('.') > -1){
			if(id.charAt(0) == '.' || id.charAt(1) == '.'){
			}
			var parts = id.split('.');
			return constructor.get(parts[0])[parts[1]];
		}
		if(id === '' || id.match(/\?|\[/)){
			return constructor.query(id,{});
		}
		return this.prepare(store.get(id));
	};
	constructor.head = function(id){
		// head just returns undefined, meaning no body
	};
	constructor.options = function(id){
		return Object.keys(constructor);
	};
	constructor.trace = function(obj){
		return obj;
	};
	constructor.prepare = function(instance){
		throw new Error("prepare must be implemented in FacetedStore implementations");
	};
	constructor.post = function(props, id){
		if(!id){
			// create a new object
			id = store.put(props);
			return constructor.get(id);
		}
		else{
			// check to see if it is an RPC object
			// TODO: Do this: if(props instanceof RPC){ // where the media handler creates RPC objects
			if("method" in props && "id" in props && "params" in props){
				// looks like JSON-RPC
				return rpcInvoke(constructor.get(id), props);
			}
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

var checkPropertyChange = require("json-schema").checkPropertyChange;
var mustBeValid = require("json-schema").mustBeValid;
var validate = require("json-schema").validate;
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
	var needSourceParameter = {};
	for(var i in facetPrototype){
		var value = facetPrototype[i]; 
		if(typeof value == "function"){
			var paramsBeforeSource = value.toString().match(/function \(([\w0-9_$, ]*)source[\),]/);
			if(paramsBeforeSource){
				needSourceParameter[i] = paramsBeforeSource.split(",").length - 1;
			}
		}
	}
	var splice = Array.prototype.splice;
	return function prepare(source, partial){
		if(!source){
			throw new DatabaseError(3, "not found");
		}
		if(source instanceof Array){
			// this handles query results, but probably should create a branch for real arrays 
			var results = extendForEach({
				forEach: function(callback){
					source.forEach(function(item){
						callback(prepare(item, true));
					});
				},
				length: storeResults.length,
			});
			results.totalCount = source.totalCount;
			return results;
		}		
		var instancePrototype = Object.create(facetPrototype, {
			load: {
				value: function(){
					if(facetSchema.allowed && !facetSchema.allowed(source, facetResolver.env)){
						throw new AccessError("Access denied to " + source);
					}
					var id = this.$ref || this.id;
					if(id){
						prepare(sourceClass.get(id));
					}
				},
				enumerable: false,
				writable: true
			}
		});
		if(!partial){
			loaded();
		}
		function loaded(){
			Object.defineProperties(instancePrototype,{
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
						validate(this, facetSchema);
						for(var i in this){
							if(this.hasOwnProperty(i)){
								var propDef = properties && properties[i];
								if(!(propDef && (propDef["transient"] || propDef.disallow))){
									source[i] = this[i];
								}
							}
						}
						sourceClass.put(source);
					},
					enumerable: false
				},
				load: {
					value: function(){
						copyFromSource();
						return prepared;
					},
					enumerable: false
				}
				
			});
		}
		function copyFromSource(){
			for(var i in source){
				if(source.hasOwnProperty(i)){
					var propDef = properties && properties[i];
					if(!(propDef && propDef.disallow)){
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
		for(var i in needSourceParameter){
			// splice in the source argument for each method that needs it
			(function(param, protoFunc){
				instancePrototype[i] = function(){
					splice.call(arguments, params, 0, source);
					return protoFunc.apply(this, arguments);
				};
			})(needSourceParameter[i], facetPrototype[i]);
		}
		if(writableProto){
			source.__proto__ = instancePrototype;
			var prepared = source;
		}
		else{
			var prepared = Object.create(facetPrototype);
			copyFromSource();
		}
		return prepared;	
	};
	
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

function rpcInvoke(target, rpc){
	try{
		return {
			result: target[rpc.method].apply(target, rpc.params),
			error: null,
			id: rpc.id
		};					
	}
	catch(e){
		return {
			result: null,
			error: e.message,
			id: rpc.id
		};					
		
	}
}