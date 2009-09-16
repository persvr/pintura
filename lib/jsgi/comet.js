var Future = require("promise").Future;
//var Lock = require("concurrency").Lock;
/**
 * Comet JSGI app factory that allows data to be sent to clients
 */
var Comet = exports.Comet = function(env, options){
	return function(env){
		if(options.maxConnections == 1 && env.session && env.session.cometCanceller){
			// if a comet connection has already been made to this clientSession, we need to try to end the other one
			env.session.cometCanceller();
		}
		var streaming = options.streaming;
		if(!env.USER_AGENT.match(/Firefox|Safari/)){
			streaming = false;
		}
		var clientSession = env.clientSession;
		var bytesSent = 0;
		var future = new Future();
		var response = {
			status: 200,
			headers:{},
			body:{
				forEach: function(write){
					clientSession.cometListener = function(chunk){
						bytesSent += chunk.length;
						write(chunk);
						if(!streaming || (bytesSent > bytesSentThreshold)){
							delete clientSession.cometListener;
							future.fulfill();
						}
					};
					if(env.session){
						env.session.cometCanceller = function(){
							response.status = 409;
							future.fulfill();
						}
					}
					sendToPage(clientSession);
					return future.promise;											
				}
			}
		};
		
		return response;
	};
};

var sendToPage = exports.sendToPage = function(clientSession, chunk){
	var chunks = clientSession.cometChunks;
	if(!chunks){
		var chunks = clientSession.cometChunks = [];
		clientSession.chunks.lock = new Lock();
	}
	var lock = chunks.lock; 
	lock.lock();
	if(chunks){
		chunks.push(chunk);
	}
	var chunksToSend;
	if(clientSession.cometListener && chunks.length){
		clientSession.cometListener(chunks.splice(0,chunks.length));
	}
	lock.unlock();
}


/**
 * Middleware that adds REST Channels to the server
 */ 
exports.Channels= function(nextApp, options /*subscribe, serializer, path*/){
	var path = options.path || "/channels";
	var serializer = options.serializer || JSON.stringify;
	var cometApp = Comet(options);
	return function(env){
		if(path == env.PATH_INFO){
			// channels handler
			return cometApp(env);			
		}else{
			if(env.HTTP_SUBSCRIBE == "*"){
				// add subscription
				var clientSession = env.clientSession;
				options.subscribe(env.PATH_INFO, function(notification){
					sendToPage(clientSession, serializer(notification, env));														
				});
			}
			var response = nextApp(env);
			response.headers["Link"] = '<' + path + '>; rel="monitor"';
			return response;
		}
	};
};
