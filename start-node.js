// helpful for debugging
var settings = require("perstore/util/settings"),
	messageJson = require("./media/message/json");

exports.start = function(jsgiApp){
	var server = require("http").createServer(
			require("jsgi-node").Listener(jsgiApp)
		);
	var port = settings.port || process.env.PORT || 80;
	server.listen(port);
	
	console.log("Listening on port " + port);
	return server;
};
