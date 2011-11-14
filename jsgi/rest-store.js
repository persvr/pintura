/**
 * JSGI app that delegates HTTP verbs to model methods, this is the core
 * dispatcher from HTTP requests to JavaScript objects calling the
 * appropriate methods on faceted models
 */
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY,
	promiseModule = require("promised-io/promise"),
	when = promiseModule.when,
	resolve = require("perstore/path").resolve,
	Response = require("./response").Response,
	settings = require("perstore/util/settings");

function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.RestStore = function(options){
	return function(request){
// N.B. in async, options.getDataModel() can be a promise, so have to wait for it
		return when(options.getDataModel(request), function(model){
			var path = request.pathInfo.substring(1);
			var scriptName = request.scriptName;
			var headers = request.headers;
			var metadata = {};
			for(var i in headers){// for now just copy all of them, probably should do certain ones though
				metadata[i] = headers[i];
			}
			metadata.request = request;
	
			var responseValue;
			var status = 200;
			var headers = {
				// should the lower level static file handlers append bytes if they support it?
				// should this only be applied on query method requests?
				"accept-ranges":"items"
			};
			var method = request.method.toLowerCase();
			if(method in METHOD_HAS_BODY){
				while(!model[method]){
					// if this model doesn't have the indicated method, we will try to drill down
					// through object properties to find the sub model
					var part, slashIndex = path.indexOf("/");
					if(slashIndex > -1 && model[part = path.substring(0, slashIndex)]){
						model = model[part];
						path = path.substring(slashIndex + 1);
						scriptName += '/' + part;
					}
					else{
						if(model[path]){
							//path += '/'; continue;
							// when the URL is of the form /Foo, and there is no handler, we will redirect to
							status = 301;
							var url = request.nodeRequest.url.split('?', 2);
							headers.location = url[0] + '/' + (url[1]||'');
							responseValue = request.pathInfo + " does not define " + method + " but a model exists at " + headers.location;
						}
						else if(method == "get"){
							status = 404;
							responseValue = (part || path) + " not found" + (model.id ? " as a sub-model for " + model.id : "");
						}
						else{
							status = 405;
							var methods = [];
							for(var i in METHOD_HAS_BODY){
								if(i in model){
									methods.push(i.toUpperCase());
								}
							}
							headers.allow = methods.join(", ");
							responseValue = method + " not defined for model " + model.id;
						}
						return {
							status: status,
							headers: headers,
							body: responseValue
						};
					}
				}
				metadata.id = decodeURIComponent(path);
	
				if(!METHOD_HAS_BODY[method]){
					if(method === "get" && (!path || path.charAt(path.length-1) == '/')){
						var queryString = request.queryString.replace(/\?.*/,'');
						// handle the range header, TODO: maybe handle ranges with another piece of middleware
						// N.B. nomatter valid Range: is present, let's honor model.maxLimit, if any
						var limit = Math.min(model.maxLimit||Infinity, model.defaultLimit||Infinity) || Infinity;
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
						// always honor existing finite model.maxLimit
						if (limit !== Infinity) {
							queryString += "&limit(" + limit + "," + start + "," + maxCount + ")";
							// FIXME: won't be better to not mangle the query and pass limit params via metadata?!
							//metadata.limit = {skip: start, limit: limit, totalCount: maxCount};
						}
						// queries are not decoded, the info needs to be retained for parsing
						responseValue = model.query(queryString, metadata);
						if(range){
							// we have to wait for promise for counts to be set (e.g., mongo)
							responseValue = when(responseValue, function(responseValue){
								return responseValue && when(responseValue.totalCount, function(count){
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
						// call the model with just the path
						responseValue = model[method](metadata.id, metadata);
					}
				}
				else{
					// call the model with the request body and the path
					responseValue = model[method](request.body, metadata);
					when(responseValue, function(){
						if(method !== "get" && responseValue){
							// include a Content-Location per http://greenbytes.de/tech/webdav/draft-ietf-httpbis-p2-semantics-08.html#rfc.section.6.1
							var schema = responseValue && responseValue.schema;
							if(schema){
								headers["content-location"] = request.scheme + "://" + request.headers.host +
										scriptName + '/' + (schema.getId(responseValue));
							}
						}
						if(promiseModule.currentContext && promiseModule.currentContext.generatedId){
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
				//if(responseValue instanceof Response){
				if(responseValue && responseValue.__isJSGIResponse__){
					return responseValue;
				}
				return {
					status: status,
					headers: headers,
					body: responseValue
				};
			});
		});
	};
};
