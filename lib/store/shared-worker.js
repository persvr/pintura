/**
* This store funnels requests from multiple workers to a single store instance in a shared worker. This is
* important for stores that must be single threaded and/or share memory.
*/
var SharedWorker = require("worker").SharedWorker;
var Remote = require("./remote").Remote;
var when  = require("promise").when;
var inSharedWorker;
exports.SharedWorkerStore = function(store){
	if(inSharedWorker){
		var restStoreApp = require("../jsgi/error").ErrorHandler(
								require("../jsgi/transactional").Transactional(require("stores"),
									require("../jsgi/rest-store").RestStore({})));
		global.onconnect = function (e) {
			e.port.onMessage = function(event){
				var request = event.data;
				request.store = store;
				when(restStoreApp(request), e.port.postMessage, e.port.postMessage);				
			};		
		};
		return {};
	}
	else{
		var sharedWorker = new SharedWorker("app", "store " + store.name);
		return Remote(sharedWorker.port.postMessage);
	}
};

if(module.id == require.main || !require.main){
	inSharedWorker = true;
	global.onconnect = function (e) {
		throw new Error("No store registered to handle requests for this worker");
	}
}
