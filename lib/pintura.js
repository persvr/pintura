/**
 * This is the essential breakdown of components for the Pintura
 */
exports.PinturaApp = function(nextApp){
	return require("jsgi/xsite").CrossSite(
		require("jsgi/session").ClientSession(
			require("jsgi/auth").Authentication(
				require("jsgi/comet").Channels(
					require("jsgi/session").Sequential(
						ObjectHandler(
							require("jsgi/static").Static(
								nextApp
							),
							require("media").Media,
							require("facet").facetedLoad
						)
					)
				)
			)
		)
	);
};

exports.ObjectHandler = function ObjectHandler(env, options){
	var media = options.media;
	var load = options.load;
	return function(env){
	try{
		checkForTablePut(env);
		var precondition = getPrecondition(env);
		if(!precondition()){
			throw Error();
		}
		var headers = setCommonHeaders();
		var target = env.requestObject;
		var status = 200;
		var method = env.REQUEST_METHOD.toLowerCase();
		switch(method){
			// get, head, and put have precise semantics that shouldn't be overriden by classes
			case "get":
				break;
			case "put":
				if(env.requestObject.id != objId){
					throw new Error();
				}
				status = 201;
				break;
			case "head":
				return {status: 204, headers: {}};
			default:
				// delete, post, and others are handled by classes 
				var requestObject = getRequestObject();
				if(method == "post" && jsonRpc)
					doJsonRpc();
				if(typeof target[method] == 'function'){
					target = target[method](requestObject, env);
				}else{
					return methodNotAllowed(); // return 405 
				}
		}
		if(env.HTTP_RANGE){
			response.headers["Content-Range"] = 
			load(env.PATH_INFO, start, end);
		}
		commit(precondition);
		return {
			status: status,
			headers: headers,
			body: target
		};
	}catch(e){
		abort();
		// convert different JS errors to HTTP status codes and any other headers and body 
		return javascriptErrorToHttp(e);
	}
};
};