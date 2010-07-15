var settings = require("commonjs-utils/settings");

exports.start = function(context){
	if (!context) context = {require: require};
	try{
		if(settings.repl === undefined || settings.repl === true){
			var stdin = process.openStdin();
			stdin.addListener("close", process.exit);
			var repl = require("repl").start("node>", stdin);
			for (var i in context) if (context.hasOwnProperty(i)) repl.context[i] = context[i];
		}
	}catch(e){
		require("sys").puts("Unabled to start repl " + e);
	}

	if(settings.replPort){
		require("net").createServer(function (socket) {
			var repl = require("repl").start("node>", socket).context.require = require;
			for (var i in context) if (context.hasOwnProperty(i)) repl.context[i] = context[i];
		}).listen(settings.replPort);
	}
};
