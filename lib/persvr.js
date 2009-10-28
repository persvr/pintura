/**
* Some backwards compatible functions for Persevere
*/

var registerClass = require("./data").registerClass;
Class = function(schema){
	global[schema.id] = registerClass(schema.id, schema);
};