/**
 * This middleware module provides Comet functionality, helping compensate for
 * browser idionsynchrasies. It also provides a REST Channels implementation. 
 */

var Future = require("promise").Future;
var pubSubWorker = new (require("worker").SharedWorker)("pubsub", "pubsub"); 
/**
 * Comet JSGI app factory that allows data to be sent to clients
 */

var topicListeners = {};
exports.CometNotifications = function(subscriptions){
	
	return function(env){
		var promise = new Promise();
		for(var i = 0; i < subscriptions.length; i++){
			var topic = subscriptions[i];
			pubSubWorker.port.postMessage(JSON.stringify({
				method:"subscribe",
				topic:subscriptions[i]
			}));
			(topicListeners[topic] = topicListeners[topic] || []).push(function(data){
				promise.fulfill({
					status:200,
					headers:{},
					body: data.body
				});
				
			}); 
		}
		return promise;
	};
};

pubSubWorker.port.onmessage = function(event){
	var data = JSON.parse(event.data);
	var listeners = topicListeners[data.topic];
	for(var i = 0; i < listeners.length; i++){
		listeners[i](data);
	}
}; 