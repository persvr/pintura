/**
 * JSGI Middleware that catches JavaScript errors and converts them to responses
 * with appropriate HTTP status codes and messages
 */
var METHOD_HAS_BODY = require("./methods").METHOD_HAS_BODY,
	DatabaseError = require("perstore/errors").DatabaseError,
	AccessError = require("perstore/errors").AccessError,
	AcceptError = require("perstore/errors").AcceptError,
	MethodNotAllowedError = require("perstore/errors").MethodNotAllowedError,
	print = require("promised-io/process").print,
	when = require("promised-io/promise").when;

exports.ErrorHandler = function(nextApp){
	return function(request){
		try{
			return when(nextApp(request), function(response){
				return response;
			}, errorHandler);
		}catch(e){
			return errorHandler(e);
		}
		function errorHandler(e){
			var status = 500;
			var headers = {};
			if(e instanceof AccessError){
				if(request.remoteUser){
					if(e instanceof MethodNotAllowedError){
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
				if(e.code == 2){
					status = 404;
				} else if(e.code == 3){
					status = 412;
				} else if(e.code == 4) {
					status = 409;
				}
			}else if(e instanceof AcceptError){
				status = 406;
			}else if(e instanceof TypeError){
				status = 403;
			}else if(e instanceof RangeError){
				status = 416;
			}else if(e instanceof URIError){
				status = 400;
			}else if(e.status){
				status = e.status;
			}
			if(status !== 404){
				print(String(e.stack || (e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message)));
			}
			return {
				status: status,
				headers: headers,
				body: e.name + ": " + e.message
			};

		}
	};
};
