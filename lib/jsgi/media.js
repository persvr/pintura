/**
 * JSGI Middleware that provides media type content negotiation. It will deserialize 
 * request.body data into real objects, and then serialize response objects into a raw 
 * format for the response body. This acts as "crossover" middleware, all apps below
 * will see request.body and response.body in pre/deserialized form. 
 */
exports.MediaConverter = MediaConverter;
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY,
	onFile = require("../media").onFile,
	when = require("promise").when;

function MediaConverter(mediaSelector, nextApp){
	return function(request){
		// TODO: Do any character set conversion
		if(METHOD_HAS_BODY[request.method.toLowerCase()]){
			if(request.headers["content-disposition"]){
				var contentDisposition = request.headers["content-disposition"];
				contentDisposition.split(";").forEach(function(dispositionParam){
					var parts = dispositionParam.split("=");
					if(parts.length === 1){
						request.body["content-disposition"] = parts[0];
					}else{
						request.body[parts[0].trim()] = parts[1].trim().replace(/"/g,'');
					}
				});
				var contentType = request.headers["content-type"];
				contentType.split(";").forEach(function(typeParam){
					var parts = typeParam.split("=");
					if(parts.length === 1){
						request.body["content-type"] = parts[0];
					}else{
						request.body[parts[0].trim()] = parts[1].trim().replace(/"/g,'');
					}
				});
				response = when(onFile(request.body), function(){
					return nextApp(request);
				}); // funnel errors to the response
			}else{
//				var contentType = request.headers["content-type"].split("/");
				var requestMedia = mediaSelector(request.store, request.headers["content-type"]);
				if(!requestMedia){
					var unsupportedError = new Error("Unsupported Media Type");
					unsupportedError.status = 415;
					throw unsupportedError;
//					return {status: 415, headers:{}, body: ["Unsupported Media Type"]};
				}
				try{
					var body = requestMedia.deserialize(request.body, request);
				}catch(e){
					e.status = 400;
					throw e;
//					return {status: 400, headers: {}, body: [e.message]};
				}
				if(typeof body.callNextApp === "function"){
					var response = body.callNextApp(nextApp);
				}else{
					request.body= body;
				}
			}
			
		}
		var response = response || nextApp(request);
		
		request.variedOn = ""; // let middleware add varied on headers to the request so we can efficiently add them all at once 
		
		return when(response, function(response){
			if(response.body === undefined){
				if(request.method === "GET"){
					response.status = 404;
					response.body = request.pathInfo + " not found";
				}
				else{
					// undefined indicates no body with non-GETs
					response.status = 204;
					response.body = [];
					return response;
				}
			}
			var responseMedia = mediaSelector(request.store, request.headers["accept"]);
			if(!responseMedia){
				//TODO: List acceptable media types
				var unsupportedError = new Error("The Accept header did not contain an acceptable media type");
				unsupportedError.status = 406;
				throw unsupportedError;
//				return {status: 406, headers: {}, body:["The Accept header did not contain an acceptable media type"]};
			}
			var headers = response.headers;
			headers.vary = (headers.vary ? headers.vary + "," : "") + "Accept" + request.variedOn;
			headers["content-type"] = responseMedia.mediaType + "; charset=UTF-8";
			if(request.store && request.store.id){
				headers["content-type"] += "; profile=../Class/" + request.store.id;
			}
			response.body = responseMedia.serialize(response.body, request, response);
			return response;
		});
	};
}
