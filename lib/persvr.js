/**
* Some backwards compatible functions for Persevere
*/

var registerClass = require("./data").registerClass;
Class = function(schema){
	return global[schema.id] = registerClass(schema.id, schema);
};