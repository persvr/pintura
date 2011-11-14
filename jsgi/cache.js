var CacheStore = require("perstore/store/cache").Cache,
	shash = require("narwhal/sha").hash;
	
exports.FetchCache= function(cache, nextApp) {
	var config = require("perstore/util/settings").cache || {};
	config.alwaysVaryOn = config.alwaysVaryOn || [];

	return function(request) {
		if (!request.queryString) {
			var fp = request.pathInfo;

			config.alwaysVaryOn.forEach(function(h){
				fp = fp + request.headers[h];
			});

			request.fingerprintKey = fp;
			var fingerprint = shash(fp).toString(16);
			request.cacheFingerprint=fingerprint;

			var cached = cache.get(fingerprint);
			if (cached && cached.content){
				var response=JSON.parse(cached.content);
				if (response.headers.vary){
					var varies = response.headers.vary.split(",");
					if (varies.length>0){
						var total=0;
						varies.forEach(function(v){
							if ((config.alwaysVaryOn.indexOf(v)<0) && (request.headers[v])){
								total++;
								fp = fp + request.headers[v];
							}
						});
					
						if(total>0){
							fingerprint = shash(fp).toString(16);
							request.cacheFingerprint = fingerprint;
							if(cached && cached.content) {
								response = JSON.parse(cached.content);
							}else{
								response=null;
							}
						}

						request.fingerprintKey = fp;
					}

				}
				if (response) {
					//TODO switch to using stat/mtime instead of cacheTimestamp
					var expiration = response.cacheTimestamp + ((config.seconds || 60) * 1000);
					var current = new Date().getTime();
					if (current < expiration){
						delete request.cacheFingerprint; 
						return response;
					} 
				}
			}
		}

		if (nextApp){
			return nextApp(request);
		}else{
			return 
		}	
	};
};


exports.UpdateCache = function(cache, nextApp){
	var config = require("perstore/util/settings").cache || {};
	config.alwaysVaryOn = config.alwaysVaryOn || [];

	return function(request) {
			var response = nextApp(request);
			var fingerprint;
			if ( response.status=="200" && request.cacheFingerprint &&  
				(response.headers['cache-control']!="no-cache") &&
				(response.headers['cache-control']!='no-store')){
				if (response.headers.vary){
					var fp = request.fingerprintKey;
                                        var varies = response.headers.vary.split(",");
                                        if (varies.length>0){
                                                varies.forEach(function(v){
                                                        if ((config.alwaysVaryOn && config.alwaysVaryOn.indexOf(v)<0)&&(request.headers[v])){
                                                                fp = fp + request.headers[v];
                                                        }
                                                });
                                                fingerprint = shash(fp).toString(16);
					}
				}else{
					fingerprint=request.cacheFingerprint;
				}
					
				var body = "";
				if (response.body.forEach) {
					response.body.forEach(function(content){
						body+=content;
					});
				}
				var tmp = response.body;
				response.body=[body];	
				response.cacheTimestamp = new Date().getTime();
				cache.put({id:fingerprint,content:JSON.stringify(response)});
				response.body=tmp;
			}

			return response;
	}
};
