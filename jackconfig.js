/**
 * The starting point for Pintura running as a Jack app.
 */
var pintura = require("pintura");

exports.app = require("jack/cascade").Cascade([ 
		// cascade from static to pintura REST handling
	require("jack/static").Static(null,{urls:[""],root:["web"]}),
	pintura.app
]);

var stores = require("stores");
var JsonFile = require("store/json-file").JsonFile;
stores.registerStore("Test", JsonFile("C:/dev/pintura/test.json"));