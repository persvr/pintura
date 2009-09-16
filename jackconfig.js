var PinturaApp = require("pintura").App;
var Cascade = require("jack/cascade").Cascade;
var Static = require("jack/static").Static;

exports.app = Cascade([
	Static(null,{urls:[""],root:["web"]}),
	PinturaApp({
	})
]);