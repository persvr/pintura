/**
 * The starting point for Pintura running as a Jack app.
 */

var pintura = require("pintura");
require("app");

// setup the Jack application
exports.app = pintura.app;

// now setup the development environment, handle static files before reloading the app
// for better performance
var File = require("file");
exports.development = function(app, options){
	return require("jack/cascade").Cascade([ 
			// cascade from static to pintura REST handling
		// the main place for static files accessible from the web
		require("jack/static").Static(null, {urls:[""],root:"public"}),
		// this will provide access to the server side JS libraries from the client
		require("jack/static").Static(null, {urls:["/lib"],root:""}),
		// the typical reloader scenario
		(!options || options.reload) ? require("jack/reloader").Reloader(File.join(File.cwd(), "jackconfig"), "app") :
								exports.app
	]);
};

// having a REPL is really helpful
new (require("worker").SharedWorker)("narwhal/repl");
