var findBestFacet = require("perstore/facet").findBestFacet,
	openObjectStore = require("perstore/model").openObjectStore;
	Facet = require("perstore/facet").Facet,
	NotFoundError = require("perstore/errors").NotFoundError,
	AccessError = require("perstore/errors").AccessError;

exports.namedFacets = {};
exports.FacetResolver = function(request){
	var resolver = {
		get: function(storeName){
//			try {
			var model = openObjectStore(storeName);
/*			} catch(x) {
				if (x instanceof NotFoundError) {
					storeName = 'View';
					model = openObjectStore(storeName);
				} else throw x;
			}*/
			var bestFacet = findBestFacet(model, request.allowedFacets);
			if(!bestFacet){
				throw new AccessError("No facet available to access " + storeName);
			}
//function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
//dir(bestFacet);
//			if (bestFacet.id == 'View') model = bestFacet; else
			model = bestFacet.forStore(model, resolver);
//dir(model);
			var contentType = request.headers["content-type"];
			if(contentType && contentType.indexOf("+") > -1){
				//var mediaFacetName = contentType.substring(0, contentType.indexOf("+"));
				var ct = contentType.split("+",2);
				var mediaFacetName = ct[0];
				request.subContentType = ct[1];
				//print("mediaFacetName: " + mediaFacetName, " subContentType = " + request.subContentType);
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
