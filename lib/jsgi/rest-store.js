/**
 * JSGI app that delegates HTTP verbs to store methods
 */
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY;

var Response = require("./response").Response;
/**
 * The core dispatcher from HTTP requests to JavaScript objects calling the 
 * appropriate methods on faceted stores
 */
exports.RestStore = function(options){
	return function(request){
		var path = request.pathInfo.substring(1);
		if(request.queryString){
			path += '?' + request.queryString; 
		}
		path = decodeURIComponent(path);
		var store = request.store;
		var responseValue;
		var status = 200;
		var headers = {};
		var method = request.method.toLowerCase();
		if(method in METHOD_HAS_BODY){
			if(!store[method]){
				if(store.__noSuchMethod__){
					if(!METHOD_HAS_BODY[method]){
						responseValue = store.__noSuchMethod__(method, [path]);
					}
					else{
						responseValue = store.__noSuchMethod__(method, [request.input, path]);
					}
				}
				else{
					status = 405;
					print("method " + method);
					responseValue = method + " not defined for store";
				}
			}
			else if(!METHOD_HAS_BODY[method]){
				if(method === "get" && request.headers.range){
					// handle the range header
					var parts = request.headers.range.match(/=(\w+)-(\w+)/);
					var start = parseFloat(parts[1], 10);
					var end = parseFloat(parts[2], 10);
					responseValue = store.query(path, {start: start, end: end});
					var count = responseValue.totalCount || responseValue.length || 0; 
					var end = Math.min(end, start + count - 1);
					headers["content-range"] = "items " + start + '-' + end + '/' + count;
					status = (start === 0 && count -1 === end) ? 200 : 206;
				}
				else{
					// call the store with just the path
					responseValue = store[method](path);
				}
			}
			else{
				// call the store with the request body and the path
				responseValue = store[method](request.input, path);
				if(request.transaction.newInstances){
					status = 201;
					headers.location = request.scheme + "://" + request.host + (request.port == 80 ? "" : (":" + request.port)) + 
							request.scriptName + '/' + request.transaction.generatedId;
				}
			}
		}
		else{
			status = 501;
		}
		if(responseValue instanceof Response){
			return responseValue;
		}
		return {
			status: status,
			headers: headers,
			body: responseValue
		};
	};
};

