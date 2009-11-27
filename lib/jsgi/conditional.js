/**
 * Handles conditional requests 
 */
var DatabaseError = require("errors").DatabaseError;
exports.Conditional = function(nextApp){
	return function(request){
		var metadata;
		var response = nextApp(request);
		var ifModifiedSince = Date.parse(request.headers["if-modified-since"]);
		var lastModified = Date.parse(response.headers["last-modified"]);
		if(ifModifiedSince && lastModified){
			if(!(lastModified > ifModifiedSince)){
				response.responseValue = undefined;
				response.body = [];
				response.status = 304;				
			} 
		}
		var ifUnmodifiedSince = Date.parse(request.headers["if-unmodified-since"]);
		if(ifModifiedSince && lastModified){
			if(lastModified > ifModifiedSince){
				// we throw an error to abort the transaction
				throw new DatabaseError(4, "Modified after " + new Date(ifUnmodifiedSince));
			}
		}
		var etag = response.headers["etag"];
		var ifMatch = request.headers["if-none-match"];
		if(etag && ifNoneMatch){
			if(etag == ifNoneMatch){
				response.responseValue = undefined;
				response.body = [];
				response.status = 304;				
			} 
		}
		var ifMatch = request.headers["if-match"];
		if(etag && ifMatch){
			if(etag != ifMatch){
				// we throw an error to abort the transaction
				throw new DatabaseError(4, "Etag does not match " + ifMatch);
			} 
		}
		return response;
	};
}
