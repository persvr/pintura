/**
 * The starting point for Pintura running in Node.
 */

// first we add all the necessary paths to require.paths
var packagesRoot = "../../../";
var packagePaths = [""] // start with the current directory
			.concat([ // now add alll the packages
				"packages/pintura/",
				"packages/pintura/engines/node/",
				"packages/pintura/engines/default/",
				"packages/perstore/",
				"packages/perstore/engines/node/",
				"packages/perstore/engines/default/",
				"packages/commonjs-utils/",
				"packages/jack/",
				"packages/narcissus/",
				"packages/jsgi-node/",
				"packages/wiky/",
				"engines/default/",
				""
				].map(function(path){ // for each package, start in the right directory
					return packagesRoot + path;
				    }));
				    
require.paths.push.apply(require.paths, packagePaths.map(function(path){
	return path + "lib";
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
		require("jsgi/static").Static({urls:[""],roots:["public"]}),
		// this will provide access to the server side JS libraries from the client
		require("jsgi/static").Static({urls:["/lib"],roots:packagePaths}),
		pintura.app
]));

// having a REPL is really helpful
require("repl").start();

process.addListener("uncaughtException", function(error){
	// obviously we don't want uncaught exceptions to crash the server
	print(error.stack);
});
