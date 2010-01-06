/**
 * The starting point for Pintura running in Node.
 */

// first we add all the necessary paths to require.paths
var packagesRoot = "../../../";

require.paths.push("lib");
require.paths.push.apply(require.paths,[
					"packages/pintura/lib",
					"packages/pintura/engines/node/lib",
					"packages/pintura/engines/default/lib",
					"packages/perstore/lib",
					"packages/perstore/engines/node/lib",
					"packages/perstore/engines/default/lib",
					"packages/commonjs-utils/lib",
					"packages/jack/lib",
					"packages/narcissus/lib",
					"packages/jsgi-node/lib",
					"packages/wiky/lib",
					"engines/default/lib",
					"lib"
					].map(function(path){
						return packagesRoot + path;
					    }));

var sys = require("sys");
// upgrade to ES5 and CommonJS globals
print = sys.puts;
global = this;
require("global");

var pintura = require("pintura");
require("app");

require("jsgi-node").start(
	require("jsgi/cascade").Cascade([ 
		// cascade from static to pintura REST handling
		// the main place for static files accessible from the web
		require("jsgi/static").Static({urls:[""],root:"public"}),
		// this will provide access to the server side JS libraries from the client
		require("jsgi/static").Static({urls:["/lib"],root:""}),
		// make the root url redirect to /Page/Root  
		require("jsgi/redirect-root").RedirectRoot(
	 	// main Pintura handler */
			pintura.app
		)
]));

// having a REPL is really helpful
require("repl").start();

process.addListener("uncaughtException", function(error){
	// obviously we don't want uncaught exceptions to crash the server
	print(error.stack);
});
