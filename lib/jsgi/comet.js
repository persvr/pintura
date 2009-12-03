/**
 * This middleware module provides Comet functionality, helping compensate for
 * browser idionsynchrasies. It also provides a REST Channels implementation. 
 */

var Promise = require("promise").Promise;
/**
 * Comet JSGI app factory that allows data to be sent to clients
 */

exports.Notifications = function(path, nextApp, subscriptions){
	return function(request){
		
		if(request.pathInfo === path){
			// TODO: This part could go in a shared middleware, since it is used by the facet middleware as well
			request.allowedFacets = request.security.getAllowedFacets(request.remoteUser, request);
			var store = request.facetedTransaction = facetSelector(request);

			var promise = new Promise();
			subscriptions = subscriptions || request.input;
			for(var i = 0; i < subscriptions.length; i++){
				var subscription = subscriptions[i];
				var parts = subscription.split('/');
				var subscriptionStore = store;
				for(var i = 1; i < parts.length - 1; i++){
					// allow for nested stores by incrementally traversing into stores 
					subscriptionStore = subscriptionStore.getEntityStore(parts[i]);
				}
				if(!subscriptionStore.subscribe){
					throw new Error("Can not subscribe to the " + subscription.substring(0, subscription.length - parts[i].length) + " store");
				}
				subscriptionStore.subscribe(parts[i], function(event){
					promise.fulfill({
						status:200,
						headers:{},
						body: data.body
					});
				});
			}
			return promise;
		}
		return nextApp(request);
		//response.headers.link = '<' + path + '>; rel="monitor"'; // we will just define the relationship in the schema
		//return response;
	};
};

