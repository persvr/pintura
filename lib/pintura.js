/**
 * This is the essential breakdown of components for the Pintura
 */
exports.app = JsgiApp(null, pinturaApp);

exports.JsgiApp = function JsgiApp(nextApp, options){
	return require("jsgi/xsite").CrossSite(
		require("jsgi/session").ClientSession(
			require("jsgi/auth").Authentication(
				require("jsgi/comet").Channels(
					require("jsgi/session").Sequential(
						Transaction(
							ObjectHandler(options),
							options.dataInterface
						)
					)
				)
			)
		)
	);
};

exports.pinturaApp = {
	media: require("media").Media,
	dataInterface: require("facet").facetedLoad,
	security: require("security").defaultSecurity
};

exports.Transactional = function Transaction(nextApp, dataInterface){
	env.transaction = dataInterface.transactionFor(env);
	try{
		var response = nextApp(env);
		if(response.status < 300){
			env.transaction.commit();
		}
		else{
			env.transaction.abort();
		}
	}
	catch(e){
		env.transaction.abort();
		throw e;
	}
}
exports.ObjectHandler = function ObjectHandler(options){
	var media = options.media;
	var dataInterface = options.dataInterface;
	var path = env.PATH_INFO;
	var tableName = path.split("/")[0];
	var id = path.split("/")[1]; 
	var tableInterface = dataInterface.forTable(tableName);
	try{
		checkForTablePut(env);
		var precondition = getPrecondition(env);
		if(!precondition()){
			throw Error();
		}
		var headers = setCommonHeaders();
		var target;
		var status = 200;
		var method = env.REQUEST_METHOD.toLowerCase();
		switch(method){
			// get, head, and put have precise semantics that shouldn't be overriden by classes
			case "get":
				break;
			case "put":
				var requestMedia = media.optimumMedia(tableInterface.getSchema(), env.CONTENT_TYPE);
				var requestObject = requestMedia.deserialize(env["jsgi.input"], tableInterface, env);
				
				status = 201;
				break;
			case "head":
				target = undefined;
			default:
				// delete, post, and others are handled by classes
				var requestMedia = media.optimumMedia(tableInterface.getSchema(), env.CONTENT_TYPE);
				var requestObject = requestMedia.deserialize(env["jsgi.input"], tableInterface, env);
				if(method == "put"){
					target = tableInterface.set(id, requestObject);
					if(env.requestObject.id != objId){
						throw new Error();
					} 
				}
				else{
					var requestObject = getRequestObject();
					if(method == "post" && jsonRpc)
						doJsonRpc();
					if(typeof target[method] == 'function'){
						target = target[method](requestObject, env);
					}else{
						return methodNotAllowed(); // return 405 
					}
				}
		}
		var responseMedia = media.optimumMedia(tableInterface.getSchema(), env.CONTENT_TYPE);
		response.body = responseMedia.serialize(target, response);
		
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