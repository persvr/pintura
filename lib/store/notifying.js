/**
 * This should wrap data stores that connect to a central repository, in order
 * to distribute data change notifications to all store subscribers.
 */
var SharedWorkerStore = require("./shared-worker").SharedWorkerStore,
	Replicated = require("store/replicated").Replicated;

exports.Notifying = function(store, id){
	var hub = exports.SubscriptionHub();
	store.subscribe = function(path, callback){
		hub.subscribe(path, callback);
	};
	store.unsubscribe = function(path, callback){
		hub.unsubscribe(path, callback);
	};
	var originalPut = store.put;
	store.put= function(object, id){
		id = originalPut(object, id);
		hub.publish({
			source: id,
			result: object,
			event: "put"
		});
	};
	var originalDelete = store["delete"];
	store["delete"] = function(object, id){
		originalDelete(object, id);
		hub.publish({
			source: id,
			event: "delete"
		});
	};
	var originalCreate = store.create;
	if(originalCreate){
		store.create = function(object, id){
			id = originalCreate(object, id);
			hub.publish({
				source: id,
				result: object,
				event: "put"
			});
		};
	}
	return store;
};
var queue = require("event-queue");
exports.SubscriptionHub= function(){
	var subscriptions = global.subscriptions = global.subscriptions || {};
	return {
		publish: function(notification){
			var source = notification.source;
			while(typeof source === "string"){
				var subsForSource = subscriptions[source];
				if(subsForSource){
					subsForSource.forEach(function(listener){
						queue.enqueue(function(){
							listener(notification);
						});
					});
				}
				source = source ? "" : null;
			}		},
		subscribe: function(path, callback){
			(subscriptions[path] = subscriptions[path] || []).push(callback); 
		},
		unsubscribe: function(path, callback){
			var subsForPath = subscriptions[path];
			if(subsForPath){
				var index = subsForPath.indexOf(callback);
				if(index > -1){
					subsForPath.splice(index, 1);
				}
			}
		},
		
		
	};
};

// This provides a subscription hub implementation, that will match notifications
// with subscriptions. This is a simple matcher that operates in O(n) time. More
// sophisticated matchers can be created to that use hash based look up (operate in 
// O(1)) or tree based lookups that support range based subscriptions (operate in
// O(log n)). 
//exports.SubscriptionHub= function(){
// TODO: create function based subscription matcher
//}