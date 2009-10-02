SchemaFacet({
	appliesTo: Object,
	allowed: function(object, env){
		return env.authenticatedUser.name == "admin";
	},
});
