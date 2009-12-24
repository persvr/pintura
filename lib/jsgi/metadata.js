/**
 * Applies metadata headers if the responseValue includes a getMetadata function 
 */
var when = require("events").when;
exports.Metadata = function(nextApp){
	return function(request){
		var metadata;
		var input = request.input;
		// first add metadata to the incoming request
		if(request.method !== "GET"){ 
			if(input.__proto__ === Object.prototype){
				input.__proto__ = {
					getMetadata: function(){
						return request.headers;
					}
				};
			}
			if(input.__proto__ === Array.prototype){
				(input.__proto__ = []).getMetadata = function(){
						return request.headers;
					};
			}
		}
		return when(nextApp(request), function(response){
			// now get the metadata from the response to add to the headers
			var value = response.responseValue;
			if(value){
				if(typeof value.getMetadata === "function"){
					metadata = value.getMetadata();
				}
				else if(value.__noSuchMethod__){
					metadata = value.__noSuchMethod__(method, [], true);
				}
				if(metadata){
					for(var i in metadata){
						if(metadata.hasOwnProperty(i)){
							response.headers[i] = metadata[i]; 
						}
					}
				}
			}
			return response;
		});
	};
}

/*
		var lastModified = callIfPossible(store, "getLastModified", value);
		if(typeof lastModified !== "undefined"){
			if(typeof lastModified === "number"){
				lastModified = new Date(lastModified);
			}
			headers["last-modified"] = lastModified.toGMTString();
		}
		
		var etag = callIfPossible(store, "getETag", value);
		if(typeof etag !== "undefined"){
			headers.etag = etag;
		}
		
		var expiresDuration = callIfPossible(store, "getExpiresDuration", value);
		if(typeof expiresDuration === "undefined"){
			expiresDuration = 1000; // one second is the default
		}
		headers.expires = new Date((lastModified || new Date()) + expiresDuration).toGMTString();
		 
		var cacheControl = callIfPossible(store, "getCacheControl", value);
		if(typeof cacheControl !== "undefined"){
			headers["cache-control"] = cacheControl;
		}
*/