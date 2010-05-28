/**
 * JSGI Middleware that provides media type content negotiation. It will deserialize 
 * request.body data into real objects, and then serialize response objects into a raw 
 * format for the response body. This acts as "crossover" middleware, all apps below
 * will see request.body and response.body in pre/deserialized form. 
 */
exports.MediaConverter = MediaConverter;
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY,
	when = require("promise").when;

function MediaConverter(mediaSelector, nextApp){
	return function(request){
		// TODO: Do any character set conversion
		if(METHOD_HAS_BODY[request.method.toLowerCase()]){
			var contentDisposition = request.headers["content-disposition"];
			if(contentDisposition && contentDisposition.substring(0,10) == "attachment"){
				contentDisposition.split(";").slice(1).forEach(function(dispositionParam){
					var parts = dispositionParam.split("=");
                    request.body[parts[0].trim()] = parts[1] && parts[1].trim().replace(/"/g,'');
                });
				request.body.attachment = true;
			}else{
				var requestMedia = mediaSelector(request.store, request.headers["content-type"]);
				if(!requestMedia){
					return {status: 415, headers:{}, body: ["Unsupported Media Type"]};
				}
				try{
					request.body = requestMedia.deserialize(request.body, request);
				}catch(e){
					return {status: 400, headers: {}, body: [e.message]};
				}
			}
			
		}
		
		request.variedOn = ""; // let middleware add varied on headers to the request so we can efficiently add them all at once 
		
		return when(nextApp(request), function(response){
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
				return {status: 406, headers: {}, body:["The Accept header did not contain an acceptable media type"]};
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
