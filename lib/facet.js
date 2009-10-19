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
var httpHandlerPrototype = {
	head: function(id){
		// head just returns undefined, meaning no body
	},
	options: function(id){
		return Object.keys(this);
	},
	put: function(props, id){
		if(typeof props.save !== "function"){
			var instance = this.get(id);
			instance.save.call(props);
			instance.load();
			return instance;
		}
		else{
			props.save();
			props.load();
			return props;
		}
		
	},
	trace: function(obj){
		return obj;
	},
	wrap: function(instance){
		throw new Error("wrap must be implemented in FacetedStore implementations");
	},
	post: function(props, id){
		if(!id){
			// create a new object
			return this.create(props);
		}
		else{
			// check to see if it is an RPC object
			// TODO: Do this: if(props instanceof RPC){ // where the media handler creates RPC objects
			if("method" in props && "id" in props && "params" in props){
				// looks like JSON-RPC
				return rpcInvoke(this.get(id), props);
			}
			// doing an incremental update
			return this.incrementalUpdate(props, id);
		}
	},
	patch: function(props, id){
		return this.copyProperties(props,id);
	},
	copyProperties: function(props, id){
		var target = this.get(id);
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
		return target;
	}
	
};
function FacetedStore(store, facetResolver, facetClass, wrap){
	function constructor(props){
		return constructor.create(props);
	}
	constructor.wrap = wrap;
	constructor.query= function(query, options){
		return this.wrap(
			typeof facetClass.query === "function" ?
				facetClass.query(query, options) :
				store.query(query, options));
	};
	constructor.get= function(id){
		id = '' + id;
		if(id.charAt(0) == '/'){
			
		}
		if(id.indexOf('.') > -1){
			if(id.charAt(0) == '.' || id.charAt(1) == '.'){
			}
			var parts = id.split('.');
			return this.get(parts[0])[parts[1]];
		}
		if(id === '' || id.match(/\?|\[/)){
			return this.query(id,{});
		}
		return this.wrap(
			typeof facetClass.get === "function" ?
				facetClass.get(id) :
				store.get(id));
	};
	constructor.create= function(props){
		var instance = this.wrap(props);
		if(typeof instance.initialize === "function"){
			instance.initialize.apply(instance, arguments);
		}
		(facetResolver.newInstances = facetResolver.newInstances || []).push(instance);
		instance.save();
		return instance;
	};
	constructor.isNew= function(instance){
		return facetResolver.newInstances && facetResolver.newInstances.indexOf(instance) > -1; 
	};
	
	constructor.__proto__ = httpHandlerPrototype;
	
	// TODO: handle immutable proto
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
	return function wrap(source, wrapped, partial){
		if(!source){
			throw new DatabaseError(3, "not found");
		}
		if(source instanceof Array){
			// this handles query results, but probably should create a branch for real arrays 
			var results = extendForEach({
				forEach: function(callback){
					source.forEach(function(item){
						callback(wrap(item, item, true));
					});
				},
				length: source.length,
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
						wrap(sourceClass.get(id));
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
						if(facetPrototype.save){
							facetPrototype.save.call(this, source);
						}
						var validation = validate(this, facetSchema);
						var instance = this;
						for(var i in this){
							if(this.hasOwnProperty(i)){
								transfer(this[i]);
							}
						}
						for (var i in source){
							if(source.hasOwnProperty(i) && !this.hasOwnProperty(i)){
								transfer(undefined);
							}
						}
						mustBeValid(validation);
						var newIndex = facetResolver.newInstances && facetResolver.newInstances.indexOf(instance) > -1; 
						try{
							if(newIndex > -1){
								// create, will try the create methods first, otherwise fall through to put
								if(typeof facetSchema.create === "function"){ 
									facetSchema.create(source);
									return this;
								}
								if(typeof sourceClass.create === "function"){
									sourceClass.create(source);
									return this;
								}
							}
							var id = typeof facetSchema.put === "function" ? 
								facetSchema.put(source) :
								sourceClass.put(source);
							if(typeof id == "string" || typeof id == "number"){
								facetResolver.generatedId = source.id = id;
							}
							return this;
						}
						finally{
							if(newIndex > -1){
								facetResolver.newInstances.splice(newIndex, 1);
							}
							copyFromSource();
						}
						function transfer(value){
							var propDef = properties && properties[i];
							propDef = propDef || facetSchema.additionalProperties; 
							var cancelled;
							if(propDef){
								if(propDef.blocked){
									addError("can't save a blocked property");
								}
								if(propDef["transient"]){
									cancelled = true;
								}
								if(source[i] !== value){
									if(propDef.readonly && source.hasOwnProperty(i)){
										addError("property is read only");
									}
									if(propDef.set){
										try{
											var newValue = propDef.set.call(instance, value, source, source[i]);
											if(newValue !== undefined){
												value = newValue;
											}
										}catch(e){
											e.rhinoException.printStackTrace();
											addError(e.message);
										}
									}
								}
							}
							if(!cancelled){
								if(value === undefined){
									delete source[i]
								}
								else{
									source[i] = value;
								}
							}
							function addError(message){
								validation.valid = false;
								validation.errors.push({property: i, message: message});
								cancelled = true;
							}
						}
					},
					enumerable: false
				},
				load: {
					value: function(){
						copyFromSource();
						return wrapped;
					},
					enumerable: false
				}
				
			});
		}
		function copyFromSource(){
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
		if(writableProto && partial === true){
			source.__proto__ = instancePrototype;
			var wrapped = source;
		}
		else{
			if(wrapped){
				wrapped.__proto__ = instancePrototype;
			}
			else{
				wrapped = Object.create(instancePrototype);
			}
			copyFromSource();
		}
		return wrapped;	
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
		var facetedStore = FacetedStore(sourceStore, facetResolver, schema,
			SchemaControlled(schema, sourceStore, facetResolver));
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