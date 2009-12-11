
var localSettings = require("packages").root;
for(var i in localSettings){
	exports[i] = localSettings[i];
}
