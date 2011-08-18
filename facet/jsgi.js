/** This facet is designed for bundling multiple requests in a single request. This is 
 * based on the JSGI object structure.
 */ 

var Facet = require("perstore/facet").Facet,
	directApp = require("../pintura").directApp,
	defer = require("promised-io/promise").defer,
	// FIXME: what is this module?
	namedFacets = require("../facet-resolver").namedFacets;

namedFacets["application/jsgi"] = exports.JsgiFacet = Facet(Object, function(store){
	return {
		forStore:  function(requestedStore){
			function genericHandler(requests, metadata){
				requests.forEach(function(request){
					request.store = requestedStore;
					(request.headers || (request.headers = {})).__proto__ = metadata;
					metadata.clientConnection;
					metadata.streamable;
					try{
						var response = directApp(request);
						if(typeof response.body.observe === "function"){
							response.body.observe()
						}
						var response = {
							
							body: directApp(request)
						};
					}catch(e){
						response = {
							error: e
						};
					}
					onResponse(response);
				});
				var responses = [];
				var onResponse;
				// maybe use lazy-array here
				responses.forEach = function(callback){
					onResponse = callback;
					var deferred = defer();
					return deferred.promise;
				};
				return responses;
			}
			return {
				get: genericHandler,
				put: genericHandler,
				post: genericHandler
			};
		}
	};
});
