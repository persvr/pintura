/**
 * A very simple file-based storage of JSON
 */
var Memory = require("./memory").Memory;
var JSONExt = require("../json-ext");
var File = require("file");
exports.JSFile = function(filename){
	var lastMod = 0;
	var store = Memory();
	store.startTransaction= function(){
		var stat = File.stat(filename);
		var fileTime = stat.mtime.getTime();
		if(fileTime > lastMod){
			lastMod = fileTime;
			store.index = JSONExt.parse(File.read(filename));
		}
	};
	store.commitTransaction= function(){
		File.write(filename, JSONExt.stringify(store.index));
	};
	return store;
};