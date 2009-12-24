// this provides sync file API
var File = require("file");
for(var i in File){
	exports[i] = File[i];
}