/**
 * A very simple file-based storage system, connects to a shared worker to do disk I/O
 */
var Memory = require("./memory").Memory;
var JSONExt = require("../json-ext");
var File = require("file");
exports.JSFile = function(filename){
	var lastMod = 0;
	var index = {};
	var store = Memory({index: index});
	store.startTransaction= function(){
		var stat = File.stat(filename);
		debugger;
		if(stat.mtime > lastMod){
			lastMod = stat.mtime;
			index = JSONExt.parse(File.read(filename));
		}
	};
	store.commitTransaction= function(){
		File.write(filename, JSONExt.stringify(index));
	};
	return store;
};