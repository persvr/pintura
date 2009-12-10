/**
 * This should wrap data stores that connect to a central repository, in order
 * to distribute data change notifications to all store subscribers.
 */
var SharedWorkerStore = require("./shared-worker").SharedWorkerStore,
	Replicated = require("./replicated").Replicated;

exports.Notifying = function(store, id){
	return Replicated(store, SharedWorkerStore(notifyingWorker(), id));
};
function notifyingWorker(id){
	var subscriptions = [];
	function notify(notification){
		subscriptions.forEach(function(subscription){
			if(typeof subscription.path == "string" ?
					notification.source==subscription.path.substring(0, notification.source.length) :
					subscription.path(notification.source)){
				subscription.callback(notification);
			}
		});
		
	} 
	return {
		subscribe: function(path, callback){
			subscriptions.push({path: path, callback: callback});
		},
		put: function(object, id){
			notify({
					result: object,
					source: id,
					event: "put"
				});
		},
		"delete": function(id){
			notify({
					source: id,
					event: "delete"
				});
		},
		query: function(){
		},
		get: function(id){
		}
	};
		
};