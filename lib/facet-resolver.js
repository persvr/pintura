var findBestFacet = require("perstore/facet").findBestFacet,
	openObjectStore = require("perstore/model").openObjectStore;
	Facet = require("perstore/facet").Facet,
	NotFoundError = require("perstore/errors").NotFoundError,
	AccessError = require("perstore/errors").AccessError;
	
exports.namedFacets = {};
exports.FacetResolver = function(request){
	var resolver = {
		get: function(storeName){
			var model = openObjectStore(storeName);
			var bestFacet = findBestFacet(model, request.allowedFacets);
			if(!bestFacet){
				throw new AccessError("No facet available to access " + storeName);
			}
			var contentType = request.headers["content-type"];
			model = bestFacet.forStore(model, resolver);
			if(contentType && contentType.indexOf("+") > -1){
				var mediaFacetName = contentType.substring(0, contentType.indexOf("+"));
				var namedFacet = exports.namedFacets[mediaFacetName];
				if(namedFacet){
					model = namedFacet.forStore(model, resolver);
				}
			}
			return model;
			/*var localeStore = Locale.facetFor(model, resolver, request.headers["accept-language"]);
			facetedStore = SchemaFacet.facetFor(model, resolver, request.headers.accept);
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
