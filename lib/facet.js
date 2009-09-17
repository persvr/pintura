pintura.Facet = function(props){
	return props;
}
function FacetedTable(clazz, schema, props){
	return Object.copy({
		wrap: function(source){
			if(!schema.allowed(source)){
				throw new AccessError("Access denied to " + source);
			}
			return this.wrapper(source);
		},
		query: function(){
			
		},
		remove: function(instance){
			clazz.remove(instance);
		}
	},props);
	
}

var checkPropertyChange = require("schema").checkPropertyChange;
var mustBeValid = require("schema").mustBeValid;
var validate = require("schema").validate;
SchemaControlled = function(schema, clazz, source, props){
	var constructor = function(){
		
	};
	var instance = Object.copy(props, Object.copy({
		get:function(name){
			return instance[name];
		},
		set: function(name, value){
			if(schema.properties && schema.properties[name]){
				mustBeValid(checkPropertyChange(value, schema.properties[name], name));
			}
			instance[name] = value;
			source[name] = value;
			clazz.update(source);
		},
		save: function(){
			validate(this, schema);
			
			for(var i in this){
				source[i] = this[i];				
			}
			clazz.update(source);
		}
	}, constructor));
};


SchemaFacet = function(schema){
	return Facet({
		forTable: function(clazz){
			if(schema.appliesTo && clazz != schema.appliesTo){//TODO: go up inheritance chain
				throw new TypeError("facet can not be applied to " + clazz);	
			}
			return FacetedTable(clazz, schema, {
				wrapper: function(source){
					return SchemaControlled(schema, clazz, source, {... copy of props from source filtered through schema...}));
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
SomePersistable
pintura.dataLoader.forEnv(env).getTable(tableName)
Facet.facetOf