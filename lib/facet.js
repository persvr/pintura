/**
 * This provides the facet-based programming model for pintura, allowing for different
 * views or forms of accessing the underlying data stores. Different facets can be used
 * for different application access points, different security levels, and different locales. 
 */
var Facet = exports.Facet = function(facet){
	Facet.instances.push(facet);
}
Facet.instances = [];
Facet.facetFor = function(env, table){
	var schema = env.HTTP_ACCEPT.match(/schema=(.*)/)[1];
	return Facet.instances.filter(function(facet){
		return facet.id == schema;
	})[0];
};
function FacetedTable(clazz, schema, props){
	function constructor(){
		
	}
	constructor.wrap= function(source){
			if(!schema.allowed(source)){
				throw new AccessError("Access denied to " + source);
			}
			return this.wrapper(source);
		};
	constructor.query= function(){
			
		};
	constructor.remove = function(instance){
			clazz.remove(instance);
		};
	for(var i in props){
		constructor[i] = props;
	}
	return constructor;
}
var checkPropertyChange = require("schema").checkPropertyChange;
var mustBeValid = require("schema").mustBeValid;
var validate = require("schema").validate;
SchemaControlled = function(source, facetSchema){
	this.__source__ = source;
	this.__facetClass__ = facetSchema;
	var properties = facetSchema.properties;
	for(var i in source){
		if(source.hasOwnProperty(i) && !(properties && properties[i] && properties[i].blocked)){
			this[i] = source[i];
		}
	}
}
// TODO: Make this dontenum
SchemaControlled.prototype.get= function(name){
	var properties = this.__facetClass__.properties;
	if(properties){
		var propDef = properties[name];
	}
	if(typeof propDef.get == "function"){
		return propDef.get.call(this, name, this.__source__);
	}
	return this[name];
};

SchemaControlled.prototype.set= function(name, value){
	var properties = this.__facetClass__.properties;
	var propDef = properties && properties[name];
	if(propDef){
		mustBeValid(checkPropertyChange(value, propDef, name));
		if(propDef.set){
			value = propDef.set.call(this, name, value, this.__source__);
		}
	}
	this.__source__.set(name) = value;
	this[name] = value;
};
SchemaControlled.prototype.save= function(){
	validate(this, schema);
	facetSchema.save(source);
};
SchemaControlled.prototype.load= function(){
};



SchemaFacet = function(facetSchema){
	return Facet({
		forTable: function(sourceClass){
			if(facetSchema.appliesTo && sourceClazz != schema.appliesTo){//TODO: go up inheritance chain
				throw new TypeError("facet can not be applied to " + clazz);	
			}
			return FacetedTable(sourceClass, facetSchema, {
				
				wrapper: function(source){
					return new SchemaControlled(source, facetSchema, sourceClass);
				},
				save: function(object){
					var source = object.__source;
					for(var i in this){
						source[i] = object[i];				
					}
					sourceClass.save();
				}
			});
		}
	});
};

var Direct = SchemaFacet({
	appliesTo: Object,
	allowed: function(object, env){
		return env.authenticatedUser.name == "admin";
	},
/*	load: function(object, source){
		return object;
	},
	update: function(object, source){
		return source;
	},*/
	
});
var ReadOnly = new SchemaFacet({
	appliesTo: Object,
	allowed: function(object, env){
		return env.security.belongsToRole(env.authenticatedUser, "read");
	},
	additionalProperties:{
		readonly: true
	}
});
