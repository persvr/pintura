// handles getting bi-directional WebSocket-style connectors to other http workers
var siblings = [];
onsiblingmessage = function(message, connection){
	connection._observers.forEach(function(callback){
		callback(message);
	});
};
// setup message distribution
onnewworker = function(connection){
	connection._observers = [];
	connection.observe = function(name, callback){
		if(name == "message"){
			connection._observers.push(callback);
		}
	};
	callbacks.forEach(function(callback){
		callback(connection);
	});
}
var callbacks = [];
exports.observe = function(name, callback){
	callbacks.push(callback);
};