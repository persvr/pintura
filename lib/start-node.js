// helpful for debugging
var settings = require("commonjs-utils/settings"),
	ws = require("ws/server"),
	messageJson = require("./media/message/json"),
	multiNode = require("multi-node/multi-node");

exports.start = function(jsgiApp, socketApp){
	var http = require("http").createServer(
			require("jsgi-node").Listener(jsgiApp)
		);
	var port = settings.port || 8080;
	var nodes = multiNode.listen({port: port, nodes: settings.processes || 1}, http);
	require("jsgi-node/ws-jsgi")(ws.createServer({
		server: http
	}), function(request){
		request.method = "POST";
		var headers = request.headers;
		headers.accept = "message/json";
		headers["content-type"] = "message/json";
		headers.stream = true;
		return jsgiApp(request);
	});
	
	nodes.addListener("node", function(stream){
		require("./pintura").app.addConnection(multiNode.frameStream(stream, true));
	});
	console.log("Listening on port " + port);
	// having a REPL is really helpful
	if(nodes.isMaster){
		require("./util/repl").start();
	}
};