/**
 * This is the top level Pintura module, that delegates functionality to the different components
 * within Pintura, setting up the different middleware to create the full Pintura JSGI app
 * and defining the default mechanisms for security, content negotiation, and persistence.
 */
require("util/es5");
var registerClass = require("data").registerClass;
var pinturaApp = exports.pinturaApp = {
	media: require("media").Media,
	storeManager: require("stores"),
	security: require("security").DefaultSecurity(registerClass("User",{}), registerClass("Auth",{})),
	FacetResolver: require("facet-resolver").FacetResolver,
	server: "Pintura"
};
try{
	org.persvr.javascript.PersevereContextFactory.init();
}catch(e){
	
}

exports.app = JsgiApp(null, pinturaApp);

function JsgiApp(nextApp, options){
	
	return require("jsgi/csrf").CSRFProtector(
		//	require("jsgi/charset").CharacterEncoding(
			require("jsgi/xsite").CrossSite(
				require("jsgi/http-params").HttpParams(
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
				//	)
				)
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
			if(env.jsgi.multithreaded){
				print("Warning: Running Pintura in a multithreaded environment may cause non-deterministic behavior");
			}
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
		var parts = env.pathInfo.split("/");
		env.store = env.facetedTransaction = FacetResolver(env);
		for(var i = 1; i < parts.length - 1; i++){
			// allow for nested stores by incrementally traversing into stores 
			env.scriptPath += '/' + parts[i];
			env.store = env.store.getEntityStore(parts[i]);
		}
		env.pathInfo = '/' + parts[i];
		return nextApp(env);
		//Set the content type header with the schema
	};
}
exports.Faceted = Faceted;

function checkForTablePut(env){
	if(!env.scriptPath && env.method=="PUT"){
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
		//response.headers.date = new Date().toString();
		return response;
	};
}
exports.PinturaHeaders = PinturaHeaders;
function MediaConverter(media, nextApp){
	return function(env){
		if(METHOD_HAS_BODY[env.method.toLowerCase()]){
			var requestMedia = media.optimumMedia(env.store, env.headers["content-type"]);
			if(!requestMedia){
				return {status: 415, headers:[], body:["Unsupported Media Type"]};
			} 
			env.requestValue = requestMedia.deserialize(env.body, env.store, env);
		}
		var response = nextApp(env);
		if(response.body === undefined){
			// undefined specifically indicates no body
			response.status = 204;
			response.body = [""];
		}
		else{
			var responseMedia = media.optimumMedia(env.store, env.headers["accept"]);
			if(!responseMedia){
				//TODO: List acceptable media types
				return {status: 406, headers:[], body:["The Accept header did not contain an acceptable media type"]};
			}
			response.headers["content-type"] = responseMedia.mediaType + ";charset=UTF-8;definedby=../Class/" + env.store.id;
			response.body = responseMedia.serialize(response.body, env, response);
		}
		return response;
	};
}
exports.MediaConverter = MediaConverter;

var DatabaseError = require("stores").DatabaseError;
var AccessError = require("security").AccessError;
METHOD_HAS_BODY = {get:false, head:false, "delete": false, options:false, copy: false, move: false, unlock: false,
put:true, post:true, trace: true, propfind: true, proppatch: true, mkcol: true, lock: true, patch: true};

/**
 * The core dispatcher from HTTP requests to JavaScript objects calling the 
 * appropriate methods on faceted stores
 */
function ObjectHandler(options){
	return function(env){
		var path = env.pathInfo.substring(1);
		if(env.queryString){
			path += '?' + env.queryString; 
		}
		path = decodeURIComponent(path);
		var store = env.store;
		var responseValue;
		var status = 200;
		var headers = {};
		var method = env.method.toLowerCase();
		if(!store[method]){
			status = 405;
			print("method " + method);
			responseValue = method + " not defined for store";
		}
		else if(method in METHOD_HAS_BODY){
			if(!METHOD_HAS_BODY[method]){
				if(method === "get" && env.headers.range){
					// handle the range header
					var parts = env.headers.range.match(/=(\w+)-(\w+)/);
					var start = parseFloat(parts[1], 10);
					var end = parseFloat(parts[2], 10);
					responseValue = store.query(path, {start: start, end: end});
					var count = responseValue.totalCount || responseValue.length || 0; 
					var end = Math.min(end, start + count - 1);
					headers["content-range"] = "items " + start + '-' + end + '/' + count;
					status = 206;
				}
				else{
					// call the store with just the path
					responseValue = store[method](path);
				}
			}
			else{
				// call the store with the request body and the path
				responseValue = store[method](env.requestValue, path);
				if(env.transaction.newInstances){
					status = 201;
					headers.location = env.transaction.generatedId;
				}
			}
		}
		else{
			status = 501;
		}
		return {
			status: status,
			headers: headers,
			body: responseValue
		};
	};
}
exports.ObjectHandler = ObjectHandler;
function javascriptErrorToHttp(e, env){
	var status = 500;
	if(e instanceof AccessError){
		status = env.authenticatedUser ? 403 : 401;
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
	print("error: " + backtrace);
	return {
		status: status,
		headers: {},
		body: backtrace
	};
}

function getPrecondition(env){
	return function(){
		return true;
	}
}