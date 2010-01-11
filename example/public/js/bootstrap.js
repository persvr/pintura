global = window; // pull all the CommonJS stuff into the global
var exports = {};
require = function(){
	return exports;
};	
