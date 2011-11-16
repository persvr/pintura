/**
 * JSGI Middleware that provides media type content negotiation. It will deserialize
 * request.body data into real objects, and then serialize response objects into a raw
 * format for the response body. This acts as "crossover" middleware, all apps below
 * will see request.body and response.body in pre/deserialized form.
 */
exports.Deserialize = Deserialize;
exports.Serialize = Serialize;
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY,
	mediaModule = require("../media"),
	when = require("promised-io/promise").when;

function Deserialize(mediaSelector, nextApp){
	return function(request){
		// TODO: Do any character set conversion
		request.variedOn = ""; // let middleware add varied on headers to the request so we can efficiently add them all at once		
		
		if(METHOD_HAS_BODY[request.method.toLowerCase()]){
			var body = request.body;
			if(!body){
				// deal with Ringo's lack of a body property
				var input = request.input;
				request.body = body = {
					forEach: function(callback) {
						var encoding = this.encoding || "UTF-8";
						input.forEach(function(data){
							callback(data.decodeToString(encoding));
						});
					}
		    	};
			}
			
			
			if(request.headers["content-disposition"]){
				var contentDisposition = request.headers["content-disposition"];
				contentDisposition.split(";").forEach(function(dispositionParam){
					var parts = dispositionParam.split("=");
					if(parts.length === 1){
						body["content-disposition"] = parts[0];
					}else{
						body[parts[0].trim()] = parts[1].trim().replace(/"/g,'');
					}
				});
				var contentType = request.headers["content-type"];
				contentType.split(";").forEach(function(typeParam){
					var parts = typeParam.split("=");
					if(parts.length === 1){
						body["content-type"] = parts[0];
					}else{
						body[parts[0].trim()] = parts[1].trim().replace(/"/g,'');
					}
				});
				return when(mediaModule.saveFile(body), function(fileObject){
					request.body = fileObject;
					if(request.method == "PUT"){
						request.method = "GET";
						return when(nextApp(request), function(response){
							request.method = "PUT";
							var target = response.body;
							if(target && target.save){
								var metadata = target.getMetadata ? target.getMetadata() : target._metadata || (target._metadata = {});
								var fileMetadata = fileObject.getMetadata() || fileObject;
								fileMetadata.id = fileObject.id;
								(metadata.alternates || (metadata.alternates = [])).push(fileMetadata);
								return when(target.save(), function(){
									var undefined;
									response.body = undefined;
									return response;
								});
							}else{
								return nextApp(request);
							}
						});
					}
					return nextApp(request);
				}); // funnel errors to the response
			}else{
//				var contentType = request.headers["content-type"].split("/");
				var requestMedia = mediaSelector(request.store, request.headers["content-type"]);
				if(!requestMedia){
					var unsupportedError = new Error("Unsupported Media Type");
					unsupportedError.status = 415;
					throw unsupportedError;
				}
				try{
					body = requestMedia.media.deserialize(body, requestMedia.parameters, request);
				}catch(e){
					e.status = 400;
					throw e;
				}
				if(typeof body.callNextApp === "function"){
					return body.callNextApp(nextApp);
				}
			}

		}
		return when(body, function(body){
			request.body = body;
			return nextApp(request);
		});
	};
}

function Serialize(mediaSelector, nextApp){
	return function(request){
		return when(nextApp(request), function(response){
			var body = response.body;
			if(body === undefined){
				if(request.method === "GET"){
					response.status = 404;
					body = request.pathInfo + " not found";
				}
				else{
					// undefined indicates no body with non-GETs
					response.status = 204;
					response.body = [];
					return response;
				}
			}
			var headers = response.headers;
			var responseMedia = mediaSelector(body, request.headers["accept"]);
			if(!responseMedia){
				//TODO: List acceptable media types
				return {status: 406, headers: {}, body:["The Accept header did not contain an acceptable media type"]};
			}
			var contentType = responseMedia.media.mediaType;
			if(headers["content-type"] != contentType){
				delete headers["content-length"];
			}
			headers.vary = (headers.vary ? headers.vary + "," : "") + "Accept" + request.variedOn;
			headers["content-type"] = contentType + "; charset=UTF-8";
			var schema = body && body.schema;
			if(schema && schema.schema){
				headers["content-type"] += "; profile=" + request.scriptName + "/Class/" +  schema.schema.getId(schema);
			}
			response.body = responseMedia.media.serialize(body, responseMedia.parameters, request, response);
			return response;
		});
	};
}
