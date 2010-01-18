/**
 * This middleware module provides Comet functionality, helping compensate for
 * browser idionsynchrasies. It also provides a REST Channels implementation. 
 */

var defer = require("promise").defer,
	MethodNotAllowedError = require("errors").MethodNotAllowedError;
/**
 * Comet JSGI app factory that allows data to be sent to clients
 */

exports.Notifications = function(path, nextApp, subscriptions){
	return function(request){
		
		if(request.pathInfo === path){
			var deferred = new defer();
			subscriptions = subscriptions || request.input;
			processSubscriptions("subscribe");
			return deferred.promise;
		}
		return nextApp(request);
		function processSubscriptions(method){
			for(var i = 0; i < subscriptions.length; i++){
				var subscription = subscriptions[i];
				var parts = subscription.split('/');
				var store = request.store;
				for(var i = 1; i < parts.length - 1; i++){
					// allow for nested stores by incrementally traversing into stores 
					store = store.openObjectStore(decodeURIComponent(parts[i]));
				}
				if(!store[method] && !store.__noSuchMethod__){
					throw new MethodNotAllowedError("Can not subscribe to the " + subscription.substring(0, subscription.length - parts[i].length) + " store");
				}
				if(store[method]){
					store[method](parts[i], subscriptionHandler);
				}
				else{
					store.__noSuchMethod__(method, [parts[i], subscriptionHandler]);
				}
			}
			
		}
		function subscriptionHandler(event){
			processSubscriptions("unsubscribe");
			deferred.resolve({
				status:200,
				headers:{},
				body: event
			});
		}
		//response.headers.link = '<' + path + '>; rel="monitor"'; // we will just define the relationship in the schema
		//return response;
	};
};

