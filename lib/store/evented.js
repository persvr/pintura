/**
 * This should wrap data stores that connect to a central repository, in order
 * to distribute data change notifications to all store subscribers.
 */
var jsgiWorker = require("../jsgi-worker");
exports.JSFile = function(filename){
	var worker = new SharedWorker("event-worker", filename);
	worker.postData({start: filename});
	return Cache(RemoteSource(jsgiWorker(worker)), MemoryStore());
};