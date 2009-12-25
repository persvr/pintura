/**
 * The starting point for Pintura running in Node.
 */
var packagesRoot = "../../../";

require.paths.push("lib");
require.paths.push.apply(require.paths,[
					"packages/pintura/lib",
					"packages/pintura/engines/node/lib",
					"packages/pintura/engines/default/lib",
					"packages/commonjs-utils/lib",
					"packages/jack/lib",
					"packages/narcissus/lib",
					"packages/jsgi-node/lib",
					"engines/default/lib",
					"lib"
					].map(function(path){
						return packagesRoot + path;
					    }));

var sys = require("sys");
print = sys.puts;
global = this;
require("global");
process.addListener("uncaughtException", function(error){
	// obviously we don't want uncaught exceptions to crash the server
	print(error);
});

var pintura = require("pintura");
require("app");

require("jsgi-node").run(
  require("jsgi/cascade").Cascade([ 
		// cascade from static to pintura REST handling
	// the main place for static files accessible from the web
	require("jsgi/static").Static({urls:[""],root:"public"}),
	// this will provide access to the server side JS libraries from the client
	require("jsgi/static").Static({urls:["/lib"],root:""}),
	// make the root url redirect to /Page/Root  
	require("jsgi/redirect-root").redirectRoot,
 	// main Pintura handler */
	pintura.app
]));

// having a REPL is really helpful
require("repl").start();
