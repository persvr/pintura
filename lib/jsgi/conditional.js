/**
 * Handles conditional requests 
 */
var DatabaseError = require("errors").DatabaseError,
	when = require("promise").whenPreservingType;
exports.Conditional = function(onlyHandleGet, nextApp){
	return function(request){
		if(!onlyHandleGet && request.method !== "GET"){
			// onlyHandleGet is appropriate when an error really needs to be thrown to 
			// abort the transaction for a problem, as in the case of pintura.  
			var ifUnmodifiedSince = Date.parse(request.headers["if-unmodified-since"]);
			var originalMethod = request.method;
			request.method = "GET";
			var getResponse = nextApp(request);
			request.method = originalMethod;
			var lastModified = Date.parse(getResponse.headers["last-modified"]);
			if(ifUnmodifiedSince && lastModified){
				if(lastModified > ifUnmodifiedSince){
					response.body = [];
					response.status = 412;				
				}
			}
			var etag = getResponse.headers["etag"];
			var ifMatch = request.headers["if-match"];
			if(etag && ifMatch){
				if(etag != ifMatch){
					response.body = [];
					response.status = 412;				
				} 
			}
		}
		var ifModifiedSince = Date.parse(request.headers["if-modified-since"]);
		var ifMatch = request.headers["if-none-match"];
		return when(nextApp(request), function(response){
			var lastModified = Date.parse(response.headers["last-modified"]);
			if(ifModifiedSince && lastModified){
				if(!(lastModified > ifModifiedSince)){
					response.body = [];
					response.status = 304;
				} 
			}
			var etag = response.headers["etag"];
			if(etag && ifNoneMatch){
				if(etag == ifNoneMatch){
					response.body = [];
					response.status = 304;				
				} 
			}
			response.headers.date = new Date().toGMTString();
			return response;
		});
	};
}
