/**
 * The starting point for Pintura running as a Jack app.
 */
var pintura = require("pintura");
require("app");

exports.app = require("jack/cascade").Cascade([ 
		// cascade from static to pintura REST handling
	require("jack/static").Static(null, {urls:[""],root:"public"}),
	require("jsgi/rewriter").Rewriter(/^\/$/, "/Page/Root", 
		pintura.app
	)
]);

