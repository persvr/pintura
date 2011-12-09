// helpful for debugging
var settings = require("perstore/util/settings"),
	ws = require("websocket-server"),
	messageJson = require("./media/message/json");

exports.start = function(jsgiApp){
	var server = require("http").createServer(
			require("jsgi-node").Listener(jsgiApp)
		);
	var port = settings.port || process.env.PORT || 80;
	server.listen(port);
	require("jsgi-node/ws-jsgi")(ws.createServer({
		server: server
	}), function(request){
		request.method = "POST";
		var headers = request.headers;
		headers.accept = "message/json";
		headers["content-type"] = "message/json";
		headers.stream = true;
		return jsgiApp(request);
	});
	
	console.log("Listening on port " + port);
};
