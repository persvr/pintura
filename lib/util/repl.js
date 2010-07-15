var settings = require("commonjs-utils/settings");

exports.start = function(){
	try{
		if(settings.repl === undefined || settings.repl === true){
			var stdin = process.openStdin();
			stdin.addListener("close", process.exit);
			require("repl").start("node>", stdin).context.require = require;
		}
	}catch(e){
		require("sys").puts("Unabled to start repl " + e);
	}
	
	if(settings.replPort){  
		require("net").createServer(function (socket) {
		  require("repl").start("node>", socket).context.require = require;
		}).listen(settings.replPort);
	}
};