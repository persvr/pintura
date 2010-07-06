/**
 * Storage of static binary files
 */
var fs = require("promised-io/fs"),
	MIME_TYPES = require("jack/mime").MIME_TYPES,
	when = require("promised-io/promise").when;
exports.depth = 1; // depth of file directory paths to use 
exports.BinaryFiles = function(path){
	return {
		get: function(id){
			if(id.charAt(0) == '.'){
				throw new Error("Invalid ID");
			}
			var parts = id.split("~", 2);
			var filePath = path + '/' + parts[0];
			var object = new BinaryFile();
			//TODO: maybe put this on the prototype so it is not enumerated
			Object.defineProperty(object,"forEach", {
				value: function(callback){
					// TODO: read the file in blocks for better scalability
					var resultPromise = fs.read(filePath);
					callback(resultPromise);
					//resultPromise.then(callback);
					return resultPromise;
				},
				enumerable: false
			});
			var stat = fs.statSync(filePath);
			if(stat.isDirectory()){
				return exports.BinaryFiles(filePath);
			}
			var filename = parts[0].split('/');
			filename = filename[filename.length - 1];
			var extension = filename.match(/\.[^\.]+$/);
            object["content-type"] = MIME_TYPES[extension];
            object["content-disposition"] = "inline"; 
			object.alternates = object;
			var extraInfo = parts[1] && id.substring(id.indexOf("~") + 1).split("_");
			if(extraInfo){
				if(extraInfo[0]){
					object["content-type"] = extraInfo[0].replace(/~/,'/');
				}
				if(extraInfo[1]){
					object["content-disposition"] = "attachment";
				}
			}
            object["content-disposition"] += "; filename=" + filename;
            object["content-length"] = stat.size;
			return object;
		},
		put: function(object, directives){
			var id = directives.id || generateId(object);
			var parts = id.split("~", 2);
			var filePath = path + '/' + parts[0];
			fs.makeTree(filePath);
			return fs.stat(filePath).then(
				function(){
					if(directives.overwrite === false){
						throw new Error("Can not overwrite existing file");
					}
					return writeFile();
				},
				function(){
					if(directives.overwrite === true){
						throw new Error("No existing file to overwrite");
					}
					return writeFile();
				});
			function writeFile(){
				return fs.open(filePath, "w", 0666).then(function(fd){
					return when(object.forEach(function(buffer){
						fs.write(fd, buffer, 0, buffer.length, null);
					}), function(){
						fs.close(fd);
						return id;
					});
				});
			}
		}
	};
};
var REVERSE_MIME_TYPES = {};
for(var i in MIME_TYPES){
	REVERSE_MIME_TYPES[MIME_TYPES[i]] = i;
}
function generateId(object){
	var id = [];
	for(var i = 0; i < exports.depth; i++){
		id.push(Math.random().toString().substring(2,6));
	}
	var filename = object.filename || Math.random().toString().substring(2);
	id.push(filename);
	id = id.join("/");
	var extension = filename.match(/\.[^\.]+$/);
	if(object["content-type"] && object["content-type"] !== MIME_TYPES[extension && extension[0]]){
		if(object.filename || !REVERSE_MIME_TYPES[object["content-type"]]){
			id += "~" + object["content-type"].replace(/[^\w-\+]/,'~');
			if(object["content-disposition"] == "attachment"){
				id += "_attach";
			}
		}else{
			id += REVERSE_MIME_TYPES[object["content-type"]];
			if(object["content-disposition"] == "attachment"){
				id += "~_attach";
			}
		}
	}
	return id;
}
function BinaryFile(){
}
BinaryFile.prototype.getMetadata = function(){
	// TODO: copy all properties except "serialize" and "getMetadata" 
	return this;
};


