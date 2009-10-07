exports.FacetResolver = function(env){
	var resolver = {
		getEntityStore: function(storeName){
			var store = env.transaction.getEntityStore(storeName);
			/*var localeStore = Locale.facetFor(store, resolver, env.headers["accept-language"]);
			facetedStore = SchemaFacet.facetFor(store, resolver, env.headers.accept);
			return facetedStore;*/
			return require("security").FullAccess(store, resolver);
		},
		createEntityStore: function(){
			return env.transaction.createEntityStore.apply(transaction, arguments);
		},
		env: env
	};
	return resolver;
}