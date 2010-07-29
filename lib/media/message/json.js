/**
 * Registers message/json media handler. This is used for sending and receiving multiple
 * requests/responses/messages, and is very useful for bulk updates and Comet
 */
var JSONExt = require("commonjs-utils/json-ext"),
	Media = require("../../media").Media,
	all = require("promised-io/promise").all,
	when = require("promised-io/promise").when,
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
		body = when(forEachableToString(body), JSONExt.parse);
		return {
			callNextApp: function(nextApp){
				return when(body, function(body){
					if(!(body instanceof Array)){
						body = [body];
					}
					var responses = [];
					var clientConnection = getClientConnection(request);
					body.forEach(function(message){
						message.__proto__ = request;
						if(!("to" in message)){
							message.to = "";
						}
						var pathInfo = message.to.charAt(0) === '/' ? message.to : request.pathInfo.substring(0, request.pathInfo.lastIndexOf('/') + 1) + message.to;
						while(lastPath !== pathInfo){
							var lastPath = pathInfo;
							pathInfo = pathInfo.replace(/\/[^\/]*\/\.\.\//,'/');
						}
						message.pathInfo = pathInfo;
						var response = nextApp(message);
						response.pathInfo = pathInfo;
						if(response.body && typeof response.body.observe === "function"){
							clientConnection.exportMore = true;
							response.body.observe(function(message){
								message.from = message.channel;
								clientConnection.send(message);
							});
						}else{
							responses.push(response);
						}
					});
					return when(all(responses), function(responses){
						return {
							status: clientConnection.exportMore ? 202: 200,
							headers: {},
							messages: true,
							body: responses
						}
					});
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
						from: value.pathInfo,
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
