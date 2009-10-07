/**
 * This will be an in-memory store
 */
var CacheStore = require("store/cache").Cache;
exports.Memory = function(options){
	options.cacheSize = 10000000000;
	options.cacheWrites = true;

	return CacheStore({
		get: function(id){
			// never return anything that isn't cached
		},
		put: function(object){
			// don't do anything, just keep it in memory
		},
		query: function(query){
			throw new Error("All queries to the in-memory store should be done through JSONQuery");
		},
		remove: function(id){
		}
	},options);
};