/**
 * JSGI app that delegates HTTP verbs to store methods, this is the core
 * dispatcher from HTTP requests to JavaScript objects calling the
 * appropriate methods on faceted stores
 */
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY,
	when = require("promised-io/promise").when,
	resolve = require("perstore/path").resolve,
	Response = require("./response").Response,
	settings = require("commonjs-utils/settings");

exports.RestStore = function(options){
	return function(request){
		// TODO: navigating the store and setting the pathInfo might go in another middleware layer
		var parts = request.pathInfo.split("/");
		for(var i = 1; i < parts.length - 1; i++){
			// allow for nested stores by incrementally traversing into stores
			request.scriptName += '/' + parts[i];
			request.pathInfo = "/" + request.pathInfo.split("/").slice(2).join("/");
			request.store = request.store.get(decodeURIComponent(parts[i]));
		}
		request.pathInfo = '/' + parts[i];

		var path = request.pathInfo.substring(1);
		if(request.queryString){
			path += "?" + request.queryString;
		}
		var headers = request.headers;
		var metadata = {};
		for(var i in headers){// for now just copy all of them, probably should do certain ones though
			metadata[i] = headers[i];
		}
		metadata.id = decodeURIComponent(path);
		metadata.request = request;

		var store = request.store;
		var responseValue;
		var status = 200;
		var headers = {
            // should the lower level static file handlers append bytes if they support it?
            // should this only be applied on query method requests?
			"accept-ranges":"items"
		};
		var method = request.method.toLowerCase();
		if(method in METHOD_HAS_BODY){
			if(!store[method]){
				status = 405;
				var methods = [];
				for(var i in METHOD_HAS_BODY){
					if(i in store){
						methods.push(i.toUpperCase());
					}
				}
				headers.allow = methods.join(", ");
				responseValue = method + " not defined for model " + store.id;
			}
			else if(!METHOD_HAS_BODY[method]){
				if(method === "get"){
					if(request.pathInfo.substring(request.pathInfo.length - 1) === "/"){
						var queryString = request.queryString.replace(/\?.*/,'');
						// handle the range header, TODO: maybe handle ranges with another piece of middleware
						// N.B. nomatter valid Range: is present, let's honor store.maxLimit, if any
						var limit = Math.min(store.maxLimit||Infinity, store.defaultLimit||Infinity) || Infinity;
						var maxCount = 0; // don't trigger totalCount evaluation unless a valid Range: is seen
						var start = 0;
						var end = Infinity;
						if (metadata.range) {
							// invalid "Range:" are ignored
							var range = metadata.range.match(/^items=(\d+)-(\d+)?$/);
							if (range) {
								start = +range[1] || 0;
								end = range[2];
								end = (end !== undefined) ? +end : Infinity;
								// compose the limit op
								if (end >= start) {
									limit = Math.min(limit, end + 1 - start);
									// trigger totalCount evaluation
									maxCount = Infinity;
								}
							}
						}
						// always honor existing finite store.maxLimit
						if (limit !== Infinity) {
							queryString += "&limit(" + limit + "," + start + "," + maxCount + ")";
							// FIXME: won't be better to not mangle the query and pass limit params via metadata?!
							//metadata.limit = {skip: start, limit: limit, totalCount: maxCount};
						}
						// queries are not decoded, the info needs to be retained for parsing
						responseValue = store.query(queryString, metadata);
						if(range){
							// we have to wait for promise for counts to be set (e.g., mongo)
							responseValue = when(responseValue, function(responseValue){
								return when(responseValue.totalCount, function(count){
									delete responseValue.totalCount;
									var end = start + (responseValue.length || 0) - 1;
									headers["content-range"] = "items " + start + '-' + end + '/' + (count || '*');
									status = (start === 0 && count -1 === end) ? 200 : 206;
									return responseValue;
								});
							});
						}
					}
					else{
						responseValue = resolve(store, path, metadata);
					}
				}
				else{
					// call the store with just the path
					responseValue = store[method](decodeURIComponent(path), metadata);
				}
			}
			else{
				// call the store with the request body and the path
				responseValue = store[method](request.body, metadata);
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

