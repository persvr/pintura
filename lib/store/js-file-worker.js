/**
 * A very simple file-based storage system
 */
var File = require("file"),
	Memory = require("store/memory").Memory,
	JSONExt = require("json-ext"),
	addListener = require("listen").addListener;
addListener(global, "onconnect", function (e) { 
	addListener(e.port, "onmessage", function(e){
		if(e.data.start){
	print("e.data.start " + e.data.start);
			require("store/jsgi-server-store").JSGIServer(JSFile(e.data.start));
		}
	});
 });
function JSFile(filename){
	
	var index = File.isFile(filename) ? 
		JSONExt.parse(File.read(filename)) : {};
		
	store = Memory({index: index});
	store.commitTransaction = function(){
		File.write(filename, JSONExt.stringify(index));
	};
	return store;
};