global = exports = window; // pull all the CommonJS stuff into the global
require = function(){
	return window;
};	
