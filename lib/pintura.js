/**
 * This is the top level Pintura module, that delegates functionality to the different components
 * within Pintura, setting up the different middleware to create the full Pintura JSGI app
 * and defining the default mechanisms for security, content negotiation, and persistence.
 */
var pinturaApp = exports.pinturaApp = {
	media: require("media").Media,
	storeManager: require("stores"),
	security: require("security").defaultSecurity,
	FacetResolver: require("facet-resolver").FacetResolver,
	server: "Pintura"
};

exports.app = JsgiApp(null, pinturaApp);

function JsgiApp(nextApp, options){
	return require("jsgi/xsite").CrossSite(
		PinturaHeaders(options.server,
			//require("jsgi/session").ClientSession(
				require("jsgi/auth").Authentication(options.security,
					//require("jsgi/session").Sequential(
						MediaConverter(options.media,
							Transactional(options.storeManager,
								Faceted(options.FacetResolver,
									ObjectHandler(options)
								)
							)
						)
					//)
				)
			//)
		)
	);
};
exports.JsgiApp = JsgiApp;

/**
 * This executes the next app in a transaction, adding a transaction object
 * as the interface for accessing persistent and commiting the transaction
 * if successful, otherwise if an error is thrown, the transaction will be aborted
 * and it will be caught and converted to the appropriate response (for ex. 
 * TypeError -> 403)
 */
function Transactional(storeManager, nextApp){
	return function(env){
		try{
			var response;
			storeManager.transaction(function(transaction){
				env.transaction = transaction;
				response = nextApp(env);
			}, getPrecondition(env));
			return response;
		}
		catch(e){
			return javascriptErrorToHttp(e);
		}
	};
}
exports.Transactional = Transactional;
/**
 * This will apply the faceting based on the current class context (in the path) for 
 * access to the underlying data storage system. The next app will set the PATH_INFO
 * as just the id in table/id.
 */
function Faceted(FacetResolver, nextApp){
	return function(env){
		var parts = env.scriptInfo.split("/");
		env.scriptInfo = parts[1];
		env.facet = 
			(env.facetedTransaction = FacetResolver(Facet, env.transaction))
				.getEntityStore(parts[0]);
		return nextApp(env);
		//Set the content type header with the schema
	};
}
exports.Faceted = Faceted;

function checkForTablePut(env){
	if(!env.scriptInfo && env.method=="PUT"){
		env.security.hasPermission(env.user, "createStore");
		env.transaction.createEntityStore(parts[0])
	}
	
}
/**
 * Applies basic headers
 */
function PinturaHeaders(serverName, nextApp){
	serverName = serverName || "Pintura";
	return function(env){
		var response = nextApp(env);
		response.headers.server = serverName;
		response.headers.date = new Date().toString();
		return response;
	};
}
exports.PinturaHeaders = PinturaHeaders;
function MediaConverter(nextApp){
	return function(env, media){
		if(!(env.method in NO_BODY_METHODS)){
			var requestMedia = media.optimumMedia(facet, env.headers["content-type"]);
			if(!requestMedia){
				return {status: 415, headers:[], body:["Unsupported Media Type"]};
			} 
			env.requestValue = requestMedia.deserialize(env.body, facet, env);
		}
		var response = nextApp(env);
		if(response.responseValue === undefined){
			// undefined specifically indicates no body
			response.status = 204;
			response.body = [""];
		}
		else{
			var responseMedia = media.optimumMedia(tableInterface.getSchema(), env.headers["accept"]);
			if(!requestMedia){
				//TODO: List acceptable media types
				return {status: 406, headers:[], body:["The Accept header did not contain an acceptable media type"]};
			} 
			response.body = responseMedia.serialize(response.responseValue, response);
		}
		return response;
	};
}
exports.MediaConverter = MediaConverter;

NO_BODY_METHODS = {"get":true, "head":true, "delete": true, "options":true};
/**
 * The core dispatcher from HTTP requests to JavaScript objects calling the 
 * appropriate methods on faceted stores
 */
function ObjectHandler(options){
	return function(env){
		var path = env.scriptInfo;
		var facet = env.facet;
		var responseValue;
		var status = 200;
		var headers = {};
		var method = env.requestMethod.toLowerCase();
		if(!facet[method]){
			return methodNotAllowed(); // return 405 or 501
		}
		if(method in NO_BODY_METHODS){
			if(method === "get" && env.headers.range){
				var pats = env.headers.range.match(/=(\w+)-(\w+)/);
				responseValue = facet.query(path + '?' + env.queryString, {start: parseFloat(parts[1], 10), end: parseFloat(parts[2], 10)});
				headers["content-range"] = "items " + start + '-' + end + '/' + response.totalCount;
				status = 206;
			}
			else{
				responseValue = facet[method](path);
			}
		}
		else{
			responseValue = facet[method](env.requestValue, path);
			if(env.transaction.hasCreated){
				status = 201;
			}
		}
		return {
			status: status,
			headers: headers,
			body: responseValue
		};
	};
}
exports.ObjectHandler = ObjectHandler;
function javascriptErrorToHttp(e){
	var status = 500;
	if(e.name=="AccessError"){
		status = 401;
	}else if(e.name=="NotFoundError"){
		status = 404;
	}else if(e.name=="PreconditionError"){
		status = 412;
	}else if(e instanceof TypeError){
		status = 403;
	}else if(e instanceof URIError){
		status = 400;
	}
	print(e.stackTrace);
	return {
		status: status,
		headers: headers,
		body: e.message
	};
}