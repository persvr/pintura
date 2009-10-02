/**
 * This will be a wrapper store that can add caching to a store
 */
var table = {};
exports.Cache = function(store, options){
	var cacheSize = options.cacheSize;
	var cacheWrites = options.cacheWrites;
	var cache = options.cacheObject || {};
	var lastAccess = {};
	var now = new Date().getTime();
	if(!options.noCleanup && typeof setInterval == "function"){
		setInterval(function(){
			now = Math.max(now, new Date().getTime());
			var expiration = now - cacheSize;
			var size = 0;
			for(var i in cache){
				if(lastAccess[i] < expiration){
					delete cache[i];
					delete lastAccess[i];
				}
				else{
					size++;
				}
			}
		}, 200);
	}
	return {
		startTransaction: function(){
			var transaction = store.startTransaction();
			return {
				get: function(id){
					var cached = cache[id];
					lastAccess[id] = now++;
					if(cached){
						return cached;
					}
					return cache[id] = transaction.get[id];
				},
				put: function(object){
					if(cacheWrites){
						cache[object.id] = object;
					}
				},
				query: function(query){
					return transaction.query(query);
				},
				"delete": function(id){
					delete cache[id];
				}
			};
		}
	};
};