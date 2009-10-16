/**
 * A very simple file-based storage system
 */
var File = require("file"),
	Memory = require("store/memory").Memory,
	JSONExt = require("json-ext");
exports.JSFile = function(filename){
	
	var index = File.isFile(filename) ? 
		JSONExt.parse(File.read(filename)) : [];
		
	store = Memory({index: cacheObject});
	store.commitTransaction = function(){
		File.write(filename, JSONExt.stringify(index));
	};
	return store;
};