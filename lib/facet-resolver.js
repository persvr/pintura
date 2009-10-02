exports.FacetResolver = function(transaction){
	var resolver = {
		getEntityStore: function(storeName){
			var store = transaction.getEntityStore(storeName);
			/*var localeStore = Locale.facetFor(store, resolver, env.headers["accept-language"]);
			facetedStore = SchemaFacet.facetFor(localeStore, resolver, env.headers.accept);
			return facetedStore;*/
			return require("security").FullAccess(store, resolver);
		},
		createEntityStore: function(){
			return transaction.createEntityStore.apply(transaction, arguments);
		}
	};
	return resolver;
}