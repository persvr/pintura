/**
 * A very simple file-based storage system, connects to a shared worker to do disk I/O
 */
var SharedWorker = require("worker").SharedWorker;
var Cache = require("./cache").Cache;
var Memory = require("./memory").Memory;
var Remote = require("./remote").Remote;
exports.JSFile = function(filename){
	var worker = new SharedWorker("store/js-file-worker", filename);
	worker.port.postMessage(JSON.stringify({start: filename}));
	jsgiWorker = function(request){
		worker.port.postDate(request);
		
	};
	return Cache(Remote(jsgiWorker), Memory());
};