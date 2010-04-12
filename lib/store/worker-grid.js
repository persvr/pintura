/**
* This store funnels requests from multiple workers to a single store instance in a shared worker. This is
* important for stores that must be single threaded and/or share memory.
*/
var Remote = require("store/remote").Remote,
	when  = require("promise").when,
	workerClient = require("jsgi-worker").client,
	Replicated = require("store/replicated").Replicated,
	replicas = [];
 
try{
	// TODO: Check to see if we really need to create a new shared worker if the request is not multi-process
	// try to get a shared worker if it is available
	var SharedWorker = require("worker").SharedWorker;
	// TODO: Use an existing worker like the HTTP server or something if we can to avoid creating extra workers
	var trackWorkers = new SharedWorker("util/track-workers", "track-workers");
	trackWorkers.port.postMessage({
		method:"subscribe",
		name: name
	});
	trackWorkers.port.onmessage = function(e){
		replicas.push(Remote(workerClient(e.port)));
	};
}
catch(e){
	// not all platforms have shared workers, proceed anyway
}
exports.WorkerGrid = function(store, id){
	if(!SharedWorker){
		return store;
	}
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
	return Replicated(store, replicas);
};

