/**
 * Applies metadata headers if the responseValue includes a getMetadata function
 */
var when = require("promised-io/promise").when;
exports.Metadata = function(nextApp){
	return function(request){
		var metadata;
		var input = request.body || '';
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
			var value = response.body;
			if(value){
				if(typeof value.getMetadata === "function"){
					metadata = value.getMetadata();
				}
				else if(value.__noSuchMethod__){
					metadata = value.__noSuchMethod__("getMetadata", [], true);
				}
				if(metadata){
					for(var i in metadata){
						if(metadata.hasOwnProperty(i)){
							value = metadata[i];
							if(typeof value !== "function"){
								response.headers[i] = value;
							}
						}
					}
				}
				if(!response.headers.expires){
					// if the expiration is not defined, we need to make sure it doesn't get cached by default
					response.headers.expires = "Thu, 01 Jan 1970 01:00:00 GMT";
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
