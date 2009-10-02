/**
 * A very simple file-based storage system
 */
var File = require("file");
var CacheStore = require("store/cache").Cache;
exports.JsonFile = function(filename){
	
	var cacheObject = File.isFile(filename) ? 
		JSON.parse(File.read(filename)) : [];
		
	cache = CacheStore({cacheObject: cacheObject});
	return {
		startTansaction: function(){
			var transaction = cache.startTransaction();
			transaction.commit = function(){
				File.write(filename, JSON.stringify(cacheObject));
			}
			return transaction;
		}
	};
};