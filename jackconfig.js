var pintura = require("pintura");

exports.app = require("jack/cascade").Cascade([
	require("jack/static").Static(null,{urls:[""],root:["web"]}),
	pintura.app
]);