/**
 * Registers message/json media handler. This is used for sending and receiving multiple
 * requests/responses/messages, and is very useful for bulk updates and Comet
 */
var JSONExt = require("commonjs-utils/json-ext"),
	Media = require("../../media").Media,
	all = require("promise").all,
	when = require("promise").when,
	serializeJson = require("../json").StreamingSerializer(JSON.stringify),
	Broadcaster = require("tunguska/jsgi/comet").Broadcaster,
	getClientConnection =  require("tunguska/jsgi/comet").getClientConnection,
	forEachableToString = require("../../media").forEachableToString;

Media({
	mediaType:"message/json",
	getQuality: function(object){
		return 0.75;
	},
	deserialize: function(body, request){
		body = JSONExt.parse(forEachableToString(body));
		return {
			callNextApp: function(nextApp){
				if(!(body instanceof Array)){
					body = [body];
				}
				var responses = [];
				var clientConnection = getClientConnection(request);
				body.forEach(function(message){
					message.__proto__ = request;
					var pathInfo = message.target.charAt(0) === '/' ? message.target : request.pathInfo.substring(0, request.pathInfo.lastIndexOf('/') + 1) + message.target;
					while(lastPath !== pathInfo){
						var lastPath = pathInfo;
						pathInfo = pathInfo.replace(/\/[^\/]*\/\.\.\//,'/');
					}
					message.pathInfo = pathInfo;
					var response = nextApp(message);
					response.pathInfo = pathInfo;
					if(response.body && typeof response.body.observe === "function"){
						response.body.observe(clientConnection.send);
					}else{
						responses.push(response);
					}
				});
				
				return when(all(responses), function(responses){
					return {
						status: 200,
						headers: {},
						messages: true,
						body: responses
					}
				});
			}
		};
	},
	serialize: function(body, request, response){
		return serializeJson(Broadcaster(function(){
			var clientConnection = getClientConnection(request);
			if(response.messages){
				body.forEach(function(value){
					clientConnection.push({
						source: value.pathInfo,
						id: request.id,
						error: value.status >= 400 ? value.status : undefined, 
						body: value.body
					});
				});
			}else{
				clientConnection.push(response);
			}
		})(request).body, request);		
	}
});