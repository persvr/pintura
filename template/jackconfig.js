/**
 * The starting point for Pintura running as a Jack app.
 */

var pintura = require("pintura");
require("app");

exports.app = require("jack/cascade").Cascade([ 
		// cascade from static to pintura REST handling
	// the main place for static files accessible from the web
	require("jack/static").Static(null, {urls:[""],root:"public"}),
	// this will provide access to the server side JS libraries from the client
	require("jack/static").Static(null, {urls:["/lib"],root:""}),
	pintura.app
]);

// having a REPL is really helpful
new (require("worker").SharedWorker)("narwhal/repl");
