/**
 * The starting point for Pintura running in Node.
 */
var packagesRoot = "../../../";

require.paths.push("lib");
require.paths.push.apply(require.paths,[
					"packages/pintura/lib",
					"packages/pintura/engines/node/lib",
					"packages/commonjs-utils/lib",
					"packages/jack/lib",
					"packages/narcissus/lib",
					"packages/hei-jsgi/lib",
					"engines/default/lib",
					"lib"
					].map(function(path){
						return packagesRoot + path;
					    }));

var sys = require("sys");
print = sys.puts;
global = this;
require("global");


var pintura = require("pintura");
require("app");

require("hei-jsgi").run(/*
  require("jack/cascade").Cascade([ 
		// cascade from static to pintura REST handling
	// the main place for static files accessible from the web
	require("jack/static").Static(null, {urls:[""],root:"public"}),
	// this will provide access to the server side JS libraries from the client
	require("jack/static").Static(null, {urls:["/lib"],root:""}),
	// make the root url map to /Page/Root  
	require("jsgi/rewriter").Rewriter(/^\/$/, "/Page/Root",
	 	// main Pintura handler */
		pintura.app
	/*)
])*/);

// having a REPL is really helpful
require("repl").start();
