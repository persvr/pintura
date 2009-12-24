/**
 * A very simple file-based storage of JSON
 */
var Memory = require("./memory").Memory;
var JSONExt = require("json-ext");
var AutoTransaction = require("stores").AutoTransaction;
var File = require("file-sync");
exports.JSFile = function(filename){
	var lastMod = 0;
	var store = Memory();
	store.startTransaction= function(){
		try{
			var stat = File.stat(filename);
		}catch(e){
			print(e);
		}
		if(stat && stat.mtime){
			var fileTime = stat.mtime.getTime();
			if(fileTime > lastMod){
				lastMod = fileTime;
				store.index = JSONExt.parse(File.read(filename));
			}
		}
	};
	store.commitTransaction= function(){
		File.write(filename, JSONExt.stringify(store.index));
	};
	store.getLastModified = function(){
		var stat = File.stat(filename);
		if(stat.mtime){
			return stat.mtime;
		}
	};
	store.getETag = function(){
		var lastModified = store.getLastModified();
		return lastModified && lastModified.getTime();
	};
	return AutoTransaction(store);
};