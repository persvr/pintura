/**
* Some backwards compatible functions for Persevere
*/

var registerClass = require("./persisted").Class;
Class = function(schema){
	return global[schema.id] = registerClass(schema.id, schema);
};