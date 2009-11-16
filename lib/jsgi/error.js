/**
 * JSGI Middleware that catches JavaScript errors and converts them to responses
 * with appropriate HTTP status codes and messages
 */
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY,
	DatabaseError = require("../errors").DatabaseError,
	AccessError = require("../errors").AccessError;

exports.ErrorHandler = function(nextApp){
	return function(request){
		try{
			return nextApp(request);
		}catch(e){
			var status = 500;
			var headers = {};
			if(e instanceof AccessError){
				if(request.remoteUser){
					if(e.noMethod){
						status = 405;
						var methods = [];
						var method = request.method.toLowerCase();
						// TODO: call getMethods on the store to discover the methods
						for(var i in request.store){
							if(i in METHOD_HAS_BODY && i !== method){
								methods.push(i.toUpperCase());
							}
						}
						headers.allowed = methods.join(", ");
					}
					else{
						status = 403;
					}
				}
				else{
					status = 401;
					// this is intentionally in a format that browsers don't understand to avoid
					// the dreaded browser authentication dialog
					headers["www-authenticate"] = "JSON-RPC; Basic";
				}
			}else if(e instanceof DatabaseError){
				if(e.code == 3){
					status = 404;
				}
				else if(e.code == 4){
					status = 412;
				}
			}else if(e instanceof TypeError){
				status = 403;
			}else if(e instanceof RangeError){
				status = 416;
			}else if(e instanceof URIError){
				status = 400;
			}
			var backtrace = String((e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message));
			return {
				status: status,
				headers: headers,
				body: backtrace
			};
			
		}
	};
}
