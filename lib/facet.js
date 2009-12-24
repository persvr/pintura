/**
 * This provides the facet-based programming model for pintura, allowing for different
 * views or forms of accessing the underlying data stores. Different facets can be used
 * for different application access points, different security levels, and different locales. 
 */
var DatabaseError = require("./errors").DatabaseError,
	AccessError = require("./errors").AccessError,
	MethodNotAllowedError = require("./errors").MethodNotAllowedError,
	defineProperties = require("./util/es5-helper").defineProperties,
	extendSome = require("lazy").extendSome,
	when = require("events").when;
	rpcInvoke = require("./json-rpc").invoke;

exports.Facet = Facet;
Facet.facetFor = function(store, resolver, mediaType){
	var schema = mediaType.match(/schema=(.*)/)[1];
	if(schema){
		return Facet.instances.filter(function(facet){
			return facet.id == schema;
		})[0];
	}
};
try{
	var readonlyEnforced = Object.create(Object.prototype);
	defineProperties(readonlyEnforced,{test:{writable:false, value: false}});
	readonlyEnforced.test = true;
	readonlyEnforced = false;
}
catch(e){
	readonlyEnforced = true;
}
var httpHandlerPrototype = {
	options: function(id){
		return Object.keys(this);
	},
	trace: function(obj){
		return obj;
	},
	wrap: function(instance){
		throw new Error("wrap must be implemented in FacetedStore implementations");
	},
	patch: function(props, id){
		return this.copyProperties(props,id);
	},
	copyProperties: function(props, id){
		var target = this.get(id);
		for(var i in props){
			if(props.hasOwnProperty(i) && (target[i] !== props[i])){
				target[i] = props[i];	
			}
			
		}
		target.save();
		return target;
	}
	
};
var NEW = {};
function FacetedStore(store, facetClass){
	function constructor(){
		return constructor.create.apply(constructor, arguments);
	}
	for(var i in facetClass){
		constructor[i] = facetClass[i];
	}
	constructor.id = store.id;
	constructor.query= function(query, options){
		if(typeof facetClass.query !== "function"){
			if(facetClass.__noSuchMethod__){
				return this.wrap(facetClass.__noSuchMethod__("query", [query, options]), this.transaction);
			}
			throw new MethodNotAllowedError("No query capability provided");
		}
		return this.wrap(facetClass.query(query, options), this.transaction);
	};
	constructor.get= function(id){
		id = '' + id;
		if(id.charAt(0) == '/'){
			return this.transaction.get(id);
		}
		if(id[0] == '.' && id[1] == '.'){
			return this.transaction.get(id.substring(3));
		}
		if(id.indexOf('.') > -1 && (id.indexOf('?') == -1 || id.indexOf('.') < id.indexOf('?'))){
			var parts = id.split('.');
			var object = this.get(parts[0]);
			var value = object && (object.get ? object.get(parts[1]) : object[parts[1]]);
			return value;
		}
		if(id === '' || id.match(/\?|\[/)){
			return this.query(id,{});
		}
		var parts = id.match(/[\.#][^\.#]+/g);
		if(parts){
			var value = this.get(id.match(/^([^\.#]*)[\.#]/)[0]);
			for(var i = 0; i < parts.length; i++){
				var part = parts[i];
				value = part[0] === '.' ? value.get(part.substring(1)) : value[part.substring(1)];
			}
			return value;
		}
		if(typeof facetClass.get !== "function"){
			if(facetClass.__noSuchMethod__){
				return this.wrap(facetClass.__noSuchMethod__("get", [id]), this.transaction);
			}
			throw new MethodNotAllowedError("No get capability provided");
		}
		return this.wrap(facetClass.get(id), this.transaction);
	};
	constructor.create= function(instance){
		instance = this.wrap({}, this.transaction, instance, NEW);
		if(typeof instance.initialize === "function"){
			instance.initialize.apply(instance, arguments);
		}
		if(this.transaction){
			(this.transaction.newInstances = this.transaction.newInstances || []).push(instance);
		}
		return when(instance.save(), function(){
			return instance;
		});
	};
	constructor.put = function(props, id){
		if(typeof props.save !== "function"){
			try{
				var instance = this.get(id);
			}
			catch(e){
				// doesn't exist, create a new instance
				return when(constructor.create(props), function(newInstance){
					if(id && ((newInstance.getId ? newInstance.getId() : newInstance.id) != id)){ 
						throw new Error("Object's id does not match the target URI");
					}
					return newInstance;
				});
			}
			return when(instance, function(instance){
				if(props.getMetadata && instance.getMetadata){
					// do conflict detection with the metadata
					var incoming = props.getMetadata();
					var current = instance.getMetadata();
					var ifUnmodifiedSince = Date.parse(incoming["if-unmodified-since"]);
					var lastModified = Date.parse(current["last-modified"]);
					if(ifModifiedSince && lastModified){
						if(lastModified > ifUnmodifiedSince){
							throw new Database(4, "Object has been modified since " + ifUnmodifiedSince);
						}
					}
					var etag = current.etag;
					var ifMatch = incoming["if-match"];
					if(etag && ifMatch){
						if(etag != ifMatch){
							throw new Database(4, "Object does match " + ifMatch);
						} 
					}
					
				}
				return when(instance.save.call(props, id), function(){
					instance.load();
					return instance;
				});
			});
		}
		else{
			return when(props.save(), function(){ 
				props.load();
				return props;
			});
		}
		
	};
	constructor.post = function(props, id){
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
			return this.copyProperties(props, id);
		}
	};
	
	constructor.isNew= function(instance){
		return this.transaction.newInstances && this.transaction.newInstances.indexOf(instance) > -1; 
	};
	
	constructor.__proto__ = httpHandlerPrototype;
	
	// TODO: handle immutable proto
	return constructor;
}
var checkPropertyChange = require("json-schema").checkPropertyChange;
var mustBeValid = require("json-schema").mustBeValid;
var validate = require("json-schema").validate;
var writableProto = !!({}.__proto__); 
var SchemaControlled = function(facetClass, facetSchema, sourceClass){
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
				needSourceParameter[i] = paramsBeforeSource[1].split(",").length - 1;
			}
		}
	}
	var splice = Array.prototype.splice;
	return function wrap(source, transaction, wrapped, partial){
		return when(source, function(source){
			if(!source){
				throw new DatabaseError(3, "not found");
			}
			if(source instanceof Array){
				// this handles query results, but probably should create a branch for real arrays 
				var results = extendSome({
					some: function(callback){
						source.some(function(item){
							callback((item && typeof item == "object" && wrap(item, transaction, item, true)) || item);
						});
					},
					length: source.length,
				});
				results.totalCount = source.totalCount;
				return results;
			}		
			var instancePrototype = Object.create(facetPrototype);
			defineProperties(instancePrototype, {
				load: {
					value: function(){
						if(facetSchema.allowed && !facetSchema.allowed(transaction.env, source)){
							throw new AccessError("Access denied to " + source);
						}
						if(source.load && this != source){
							var loadingSource = source.load();
						}
						else{
							var loadingSource = sourceClass.get(source.getId ? source.getId() : source.id);
						}
						return when(loadingSource, function(loadingSource){
							source = loadingSource;
							copyFromSource();
							loaded();
							return wrapped;
						});
					},
					enumerable: false,
					writable: true
				}
			});
			if(partial !== true){
				loaded();
			}
			function loaded(){
				defineProperties(instancePrototype,{
					get: {
						value: function(name){
							if(links[name]){
								return wrap(facetClass.get(this[links[name]]), transaction);
							}
							if(facetPrototype.get){
								if(facetPrototype.get === DELEGATE){
									return sourceClass.prototype.get.call(source, name);
								}
								return facetPrototype.get.call(this, name)
							}
							
							var value = this[name];
							if(value && value.$ref){
								return wrap(facetClass.get(value.$ref), transaction);
							}
							return value;
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
							sourceClass.get(source.getId ? source.getId() : source.id).set(name, value);
							this[name] = value;
						},
						enumerable: false
					},
					save: {
						value: function(id){
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
							if(transaction){
								var newIndex = transaction.newInstances && transaction.newInstances.indexOf(instance);
							} 
							try{
								var method = newIndex > -1 ? "create" : "put"; 
								if(typeof facetSchema[method] === "function"){
									var id = facetSchema[method](source, id);
								}
								else if(typeof facetSchema.put === "function"){
									var id = facetSchema.put(source, id);
								}
								else{
									if(facetSchema.__noSuchMethod__){
										var id = facetSchema.__noSuchMethod__(method, [source, id]);
									}
									else{
										throw new MethodNotAllowedError(method + " is not allowed");
									}
								}
								var self = this;
								/*if(typeof id == "string" || typeof id == "number"){
									source.id = id;
								}*/
								return when(id, function(){
									copyFromSource();
									return self;
								});
							}
							finally{
								if(newIndex > -1){
									transaction.generatedId = source.getId ? source.getId() : source.id;
									transaction.newInstances.splice(newIndex, 1);
								}
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
										if(propDef.set){
											try{
												var newValue = propDef.set.call(instance, value, source, source[i]);
												if(newValue !== undefined){
													value = newValue;
												}
											}catch(e){
												addError(e.message);
											}
										}
										else if(propDef.get){
											cancelled = true;
										}
										else if(propDef.readonly && source.hasOwnProperty(i)){
											addError("property is read only");
										}
										
									}
								}
								if(!cancelled){
									if(value === undefined){
										delete source[i];
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
							if(typeof source.load === "function"){
								source.load();
							}
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
							wrapped[i] = source[i];
						}
					}
				}
				for(var i in properties){
					var propDef = properties[i];
					if(propDef.get){
						wrapped[i] = propDef.get.call(source, i);
					}
				}
			}
			for(var i in needSourceParameter){
				// splice in the source argument for each method that needs it
				(function(param, protoFunc, i){
					instancePrototype[i] = function(){
						splice.call(arguments, param, 0, source);
						return protoFunc.apply(this, arguments);
					};
				})(needSourceParameter[i], facetPrototype[i], i);
			}
			if(writableProto && partial === true){
				source.__proto__ = instancePrototype;
				wrapped = source;
			}
			else{
				if(wrapped){
					wrapped.__proto__ = instancePrototype;
				}
				else{
					wrapped = Object.create(instancePrototype);
				}
				if(partial !== NEW){
					copyFromSource();
				}
			}
			if(facetSchema.onWrap){
				wrapped = facetSchema.onWrap(wrapped) || wrapped;
			}
			return wrapped;	
		});
	};
}
function canFacetBeAppliedTo(appliesTo, store){
	store = store._baseFacetedStore || store;
	if(appliesTo && appliesTo != Object){
		while(store != appliesTo){
			store = store["extends"];
			if(!store){
				return false;		
			}
		}
	}
	return true;	
};

/**
 * Finds the best facet for the given store from the list of provided facets
 */
exports.findBestFacet = function(store, facets){
	var allInstances = Facet.instances;
	// TODO: we may need to index of id for base stores since there can be multiple
	// instances generated from a database
	store = store._baseFacetedStore || store;
	var bestFacet, facet, index, allIndex = -1;
	while(true){
		while((allIndex = appliesTos.indexOf(store, allIndex + 1)) > -1){
			if((index = facets.indexOf(allInstances[allIndex])) > -1){
				var facet = facets[index];
				if(!bestFacet || (facet.quality > (bestFacet.quality || 0.001))){
					bestFacet = facet;
				}
			}
		}
		if(store == Object){
			break;
		}
		store = store["extends"] || Object;
	}
	return bestFacet;
};


function Facet(appliesTo, schema){
	var baseFacetedStore = FacetedStore(appliesTo, schema);
	baseFacetedStore.wrap = SchemaControlled(baseFacetedStore, schema, appliesTo);
	function FacetForStore(sourceStore, transaction){
		if(!canFacetBeAppliedTo(appliesTo, sourceStore)){
			throw new TypeError("facet can not be applied to " + sourceStore.name);
		}
		if(appliesTo == sourceStore){
			facetedStore = function(){
				return facetedStore.create.apply(facetedStore, arguments);
			}
			facetedStore.__proto__ = baseFacetedStore;
		}
		else{
			facetedStore = FacetedStore(sourceStore, schema);
			facetedStore.wrap = SchemaControlled(facetedStore, schema, sourceStore);
		}
		facetedStore.transaction = transaction;
		return facetedStore;
	}
	baseFacetedStore.forStore = FacetForStore;
	baseFacetedStore._baseFacetedStore = baseFacetedStore;
	Facet.instances.push(baseFacetedStore);
	appliesTos.push(appliesTo || Object);
	return baseFacetedStore;
};
var appliesTos = [];
Facet.instances = [];

exports.Restrictive = function(appliesTo, schema){
	schema.__noSuchMethod__ || (schema.__noSuchMethod__ = function(name, args, onlyIfAvailable){
		if(name.substring(0,3) === "get" || name === "query"){
			if(appliesTo[name]){
				return appliesTo[name].apply(appliesTo, args);	
			}
			if(appliesTo.__noSuchMethod__){
				return appliesTo.__noSuchMethod__(name, args);
			}
		}
		if(!onlyIfAvailable){
			throw new MethodNotAllowedError(name + " is not allowed");
		}
	});
	var appliesToPrototype = appliesTo.prototype;
	if(appliesToPrototype){
		var schemaPrototype = schema.prototype = schema.prototype || {};
		if(appliesToPrototype.get){
			schemaPrototype.get = DELEGATE;
		}
	}
	return Facet(appliesTo, schema);
}
var DELEGATE = function(){};
exports.Permissive = function(appliesTo, schema){
	schema.__noSuchMethod__ || (schema.__noSuchMethod__ = function(name, args, onlyIfAvailable){
		if(appliesTo[name]){
			return appliesTo[name].apply(appliesTo, args);	
		}
		if(appliesTo.__noSuchMethod__){
			return appliesTo.__noSuchMethod__(name, args);
		}
		if(!onlyIfAvailable){
			throw new MethodNotAllowedError(name + " is not allowed");
		}
	});
	var appliesToPrototype = appliesTo.prototype;
	if(appliesToPrototype){
		var schemaPrototype = schema.prototype = schema.prototype || {};
		schemaPrototype.__noSuchMethod__ = function(name, source, args){
			return appliesToPrototype[name].apply(source, args);
		}
		if(appliesToPrototype.get){
			schemaPrototype.get = DELEGATE;
		}
	}
	return Facet(appliesTo, schema);
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
