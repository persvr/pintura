/**
 * JSGI app that delegates HTTP verbs to store methods, this is the core 
 * dispatcher from HTTP requests to JavaScript objects calling the 
 * appropriate methods on faceted stores
 */
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY,
	when = require("promise").when,
	Response = require("./response").Response;
	
exports.RestStore = function(options){
	return function(request){
		// TODO: navigating the store and setting the pathInfo might go in another middleware layer
		var parts = request.pathInfo.split("/");
		for(var i = 1; i < parts.length - 1; i++){
			// allow for nested stores by incrementally traversing into stores
			request.scriptName += '/' + parts[i];
			request.pathInfo = "/" + request.pathInfo.split("/").slice(2).join("/");
			request.store = request.store.openObjectStore(decodeURIComponent(parts[i]));
		}
		request.pathInfo = '/' + parts[i];
		
		var path = request.pathInfo.substring(1);
		if(request.queryString){
			path += '?' + request.queryString; 
		}
		var headers = request.headers;
		var metadata = {};
		for(var i in headers){// for now just copy all of them, probably should do certain ones though
			metadata[i] = headers[i];
		}
		metadata.id = path;
		
		var store = request.store;
		var responseValue;
		var status = 200;
		var headers = {
			"accept-ranges":"items", // should the lower level static file handlers append bytes if they support it?
		};
		var method = request.method.toLowerCase();
		if(method in METHOD_HAS_BODY){
			if(!store[method]){
				if(store.__noSuchMethod__){
					if(!METHOD_HAS_BODY[method]){
						responseValue = store.__noSuchMethod__(method, [decodeURIComponent(path), metadata]);
					}
					else{
						responseValue = store.__noSuchMethod__(method, [request.input, metadata]);
					}
				}
				else{
					status = 405;
					var methods = [];
					for(var i in METHOD_HAS_BODY){
						if(i in store){
							methods.push(i.toUpperCase());
						}
					}
					headers.allow = methods.join(", ");
					responseValue = method + " not defined for store " + store.id;
				}
			}
			else if(!METHOD_HAS_BODY[method]){
				if(method === "get" && request.headers.range){
					// handle the range header
					var parts = request.headers.range.match(/=(\w+)-(\w+)/);
					var start = parseFloat(parts[1], 10);
					var end = parseFloat(parts[2], 10);
					metadata.start = start;
					metadata.end = end;
					// queries are not decoded, the info needs to be retained for parsing
					responseValue = store.query(path, metadata);
					var count = responseValue.totalCount || responseValue.length || 0; 
					var end = Math.min(end, start + count - 1);
					headers["content-range"] = "items " + start + '-' + end + '/' + count;
					status = (start === 0 && count -1 === end) ? 200 : 206;
				}
				else{
					// call the store with just the path
					responseValue = store[method](decodeURIComponent(path), metadata);
				}
			}
			else{
				// call the store with the request body and the path
				responseValue = store[method](request.input, metadata);
				when(responseValue, function(){
					if(method !== "get" && responseValue){
						// include a Content-Location per http://greenbytes.de/tech/webdav/draft-ietf-httpbis-p2-semantics-08.html#rfc.section.6.1
						headers["content-location"] = request.scheme + "://" + request.host + (request.port == 80 ? "" : (":" + request.port)) + 
								request.scriptName + '/' + (responseValue.getId ? responseValue.getId() : responseValue.id);
					}
					if(request.transaction.generatedId){
						status = 201;
						headers.location = headers["content-location"]; // maybe it should come from transaction.generatedId?
					}
				});
			}
			
		}
		else{
			status = 501;
		}
		return when(responseValue, function(responseValue){
			if(responseValue instanceof Response){
				return responseValue;
			}
			return {
				status: status,
				headers: headers,
				body: responseValue
			};
		});
	};
};

