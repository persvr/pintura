/**
 * A very simple file-based storage system
 */
var File = require("file");
var Memory = require("store/memory").Memory;
exports.JsonFile = function(filename){
	
	var cacheObject = File.isFile(filename) ? 
		JSON.parse(File.read(filename)) : [];
		
	store = Memory({cacheObject: cacheObject});
	store.commitTransaction = function(){
		File.write(filename, JSON.stringify(cacheObject));
	};
	return store;
};