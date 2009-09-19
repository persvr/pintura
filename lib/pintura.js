/**
 * This is the top level Pintura module, that delegates functionality to the different components
 * within Pintura, setting up the different middleware to create the full Pintura JSGI app
 * and defining the default mechanisms for security, content negotiation, and persistence.
 */
var pinturaApp = exports.pinturaApp = {
	media: require("media").Media,
	dataInterface: require("persistence").dataInterface(require("facet").Facet),
	security: require("security").defaultSecurity
};

exports.app = JsgiApp(null, pinturaApp);

function JsgiApp(nextApp, options){
	return require("jsgi/xsite").CrossSite(
		require("jsgi/session").ClientSession(
			require("jsgi/auth").Authentication(
				require("jsgi/comet").Channels(
					require("jsgi/session").Sequential(
						Transactional(
							Faceted(
								PinturaHeaders(
									ObjectHandler(options)
								)
							),
							options.dataInterface
						)
					)
				)
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
function Transaction(nextApp, dataInterface){
	return function(env){
		env.transaction = dataInterface.transactionFor(env);
		try{
			var response = nextApp(env);
			env.transaction.commit(getPrecondition(env));
		}
		catch(e){
			env.transaction.abort();
			return javascriptErrorToHttp(e);
		}
	};
}
exports.Transactional = Transaction;
/**
 * This will apply the faceting based on the current class context (in the path) for 
 * access to the underlying data storage system. The next app will set the PATH_INFO
 * as just the id in table/id.
 */
function Faceted(nextApp, dataInterface){
	return function(env){
		checkForTablePut(env);
		var parts = env.PATH_INFO.split("/");
		env.PATH_INFO = parts[1]; 
		env.facet = env.transaction.tableFor(parts[0]);
		return nextApp(env);
		//Set the content type header with the schema
	};
}
exports.Faceted = Faceted;
/**
 * Applies basic headers
 */
function PinturaHeaders(nextApp){
	return function(env){
		var response = nextApp(env);
		response.headers.Server = "Pintura";
		response.headers.Date = new Date().toString();
		return response;
	};
}
exports.PinturaHeaders = PinturaHeaders;
/**
 * The core dispatcher from HTTP requests to JavaScript objects, deserializing
 * request bodies, calling the appropriate methods and performing serialization
 */
function ObjectHandler(options){
	return function(env){
		var media = options.media;
		var dataInterface = options.dataInterface;
		var id = env.PATH_INFO;
		var facet = env.facet;
		
		var target = facet.get(id);
		var status = 200;
		var method = env.REQUEST_METHOD.toLowerCase();
		switch(method){
			// get, head, and put have precise semantics that shouldn't be overriden by classes
			case "get":
				break;
			case "put":
				var requestObject = deserialize();
				
				status = 201;
				break;
			case "head":
				target = undefined;
			default:
				// delete, post, and others are handled by classes
				var requestObject = deserialize();
				if(method == "put"){
					target = facet.set(id, requestObject);
					if(env.requestObject.id != objId){
						throw new Error();
					} 
				}
				else{
					var requestObject = deserialize();
					if(method == "post" && jsonRpc)
						doJsonRpc();
					if(typeof target[method] == 'function'){
						target = target[method](requestObject, env);
					}else{
						return methodNotAllowed(); // return 405 
					}
				}
		}
		range();
		return {
			status: status,
			headers: {},
			body: serialize()
		};
		function deserialize(){
			var requestMedia = media.optimumMedia(facet, env.CONTENT_TYPE);
			return requestMedia.deserialize(env["jsgi.input"], facet, env);
		}
		function serialize(){
			var responseMedia = media.optimumMedia(tableInterface.getSchema(), env.CONTENT_TYPE);
			return responseMedia.serialize(target, response);
			
		}
		function range(){
			if(env.HTTP_RANGE){
				response.headers["Content-Range"] = 
				load(env.PATH_INFO, start, end);
				status = 206;
			}
		}
	};
}
exports.ObjectHandler = ObjectHandler;