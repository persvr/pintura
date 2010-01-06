var findBestFacet = require("./facet").findBestFacet,
	openObjectStore = require("model").openObjectStore;
	Facet = require("./facet").Facet,
	AccessError = require("./errors").AccessError;
	
exports.FacetResolver = function(request){
	var resolver = {
		openObjectStore: function(storeName){
			var model = openObjectStore(storeName);
			var bestFacet = findBestFacet(model, request.allowedFacets);
			if(!bestFacet){
				throw new AccessError("No facet available to access " + storeName);
			}
			return bestFacet.forStore(model, resolver);
			/*var localeStore = Locale.facetFor(model, resolver, env.headers["accept-language"]);
			facetedStore = SchemaFacet.facetFor(model, resolver, env.headers.accept);
			return facetedStore;*/
		},
		createEntityStore: function(){
			return request.transaction.createObjectStore.apply(request.transaction, arguments);
		},
		request: request,
		id: "Root"
	};
	return resolver;
};