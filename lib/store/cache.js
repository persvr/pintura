/**
 * This will be a wrapper store that can add caching to a store
 */
var table = {};
exports.Cache = function(store, cacheStore, options){
	options = options || {};
	var cacheSize = options.cacheSize;
	var cacheWrites = "cacheWrites" in options ? options.cacheWrites : true;
	var lastAccess = {};
	var now = new Date().getTime();
	if(!options.noCleanup && typeof setInterval == "function"){
		setInterval(function(){
			now = Math.max(now, new Date().getTime());
			var expiration = now - cacheSize;
			var size = 0;
			for(var i in cache){
				if(lastAccess[i] < expiration){
					cacheStore["delete"](i);
					delete lastAccess[i];
				}
				else{
					size++;
				}
			}
		}, 200);
	}
	return {
		get: function(id){
			var cached = cacheStore.get(id);
			lastAccess[id] = now++;
			if(cached){
				return cached;
			}
			return cache[id] = store.get[id];
		},
		put: function(object, id){
			if(cacheWrites){
				cacheStore.put(object, id);
			}
			return store.put(object, id);
		},
		query: function(query, options){
			return store.query(query, options);
		},
		"delete": function(id){
			store["delete"](id);
			cacheStore["delete"](id);
		}
	};
};