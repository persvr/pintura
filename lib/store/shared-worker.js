/**
* This store funnels requests from multiple workers to a single store instance in a shared worker. This is
* important for stores that must be single threaded and/or share memory.
*/
var SharedWorker = require("worker").SharedWorker,
	Remote = require("./remote").Remote,
	when  = require("promise").when,
	workerClient = require("jsgi-worker").client;
	
exports.SharedWorkerStore = function(store, id){
	var workerName = "store " + id;
	if(require("worker").name == workerName){
		var restStoreApp = require("../jsgi/error").ErrorHandler(
								require("../jsgi/transactional").Transactional(require("stores"),
									require("../jsgi/rest-store").RestStore({})));
		global.onconnect = function (e) {
			e.port.onmessage = function(event){
				debugger;
				var request = event.data;
				request.store = store;
				request.jsgi = {version: [0,3],
		            errors: system.stderr,
		            multithread: false,
		            multiprocess: true,
		            async: true,
		            runOnce: false
		        };
				when(restStoreApp(request), 
					function(){
						debugger;
						e.port.postMessage
					}, e.port.postMessage);				
			};		
		};
		return {};
	}
	else{
		var sharedWorker = new SharedWorker("app", workerName);
		return Remote(workerClient(sharedWorker));
	}
};

