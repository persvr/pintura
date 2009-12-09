/**
 * This middleware module provides Comet functionality, helping compensate for
 * browser idionsynchrasies. It also provides a REST Channels implementation. 
 */

var Promise = require("promise").Promise,
	MethodNotAllowedError = require("../errors").MethodNotAllowedError;
/**
 * Comet JSGI app factory that allows data to be sent to clients
 */

exports.Notifications = function(path, nextApp, subscriptions){
	return function(request){
		
		if(request.pathInfo === path){
			var promise = new Promise();
			subscriptions = subscriptions || request.input;
			for(var i = 0; i < subscriptions.length; i++){
				var subscription = subscriptions[i];
				var parts = subscription.split('/');
				var store = request.facetedTransaction;
				for(var i = 1; i < parts.length - 1; i++){
					// allow for nested stores by incrementally traversing into stores 
					store = store.getEntityStore(parts[i]);
				}
				if(!store.subscribe && !store.__noSuchMethod__){
					throw new MethodNotAllowedError("Can not subscribe to the " + subscription.substring(0, subscription.length - parts[i].length) + " store");
				}
				if(store.subscribe){
					store.subscribe(parts[i], subscriptionHandler);
				}
				else{
					store.__noSuchMethod__("subscribe", [parts[i], subscriptionHandler]);
				}
				function subscriptionHandler(event){
					promise.resolve({
						status:200,
						headers:{},
						body: data.body
					});
				}
			}
			return promise;
		}
		return nextApp(request);
		//response.headers.link = '<' + path + '>; rel="monitor"'; // we will just define the relationship in the schema
		//return response;
	};
};

