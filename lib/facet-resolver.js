var findBestFacet = require("./facet").findBestFacet,
	Facet = require("./facet").Facet,
	AccessError = require("./errors").AccessError;
	
exports.FacetResolver = function(request){
	var resolver = {
		openObjectStore: function(storeName){
			var store = request.transaction.openObjectStore(storeName);
			var bestFacet = findBestFacet(store, request.allowedFacets);
			if(!bestFacet){
				throw new AccessError("No facet available to access " + storeName);
			}
			return bestFacet.forStore(store, resolver);
			/*var localeStore = Locale.facetFor(store, resolver, env.headers["accept-language"]);
			facetedStore = SchemaFacet.facetFor(store, resolver, env.headers.accept);
			return facetedStore;*/
			return require("./security").FullAccess(store, resolver);
		},
		createEntityStore: function(){
			return env.transaction.createEntityStore.apply(transaction, arguments);
		},
		request: request,
		id: "Root"
	};
	return resolver;
};