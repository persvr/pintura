/**
 * Storage of static binary files
 */
var fs = require("fs-promise"),
	MIME_TYPES = require("jack/mime").MIME_TYPES,
	when = require("promise").when;
exports.depth = 1; // depth of file directory paths to use 
exports.BinaryFiles = function(path){
	return {
		get: function(id){
			if(id.match(/[\W-]/)){
				throw new Error("Invalid ID");
			}
			var parts = id.split("_", 3);
			var filePath = path + '/' + parts[0].replace(/-/g,'/') + id.substring(parts[0].length);
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
			var filename = parts[1];
			var extension = filename.match(/\.[^\.]+$/);
			object.alternates = object;
            object["content-type"] = parts[2] ? parts[2](/~/g,'/') : MIME_TYPES[extension];
            object["content-disposition"] = 
            	(id.charAt(0) == "a" ? "attachment" : "inline") + 
            		"; filename=" + filename;
            object["content-length"] = fs.statSync(filePath).size;
			return object;
		},
		put: function(object, directives){
			var id = directives.id || generateId(object);
			var parts = id.split("_", 3);
			var filePath = path + '/' + parts[0].replace(/-/g,'/') + id.substring(parts[0].length);
			ensurePath(filePath);
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
	var id = object["content-disposition"]  == "attachment" ? ["a" + Math.random().toString().substring(2,6)] : [Math.random().toString().substring(2,6)];
	for(var i = 1; i < exports.depth; i++){
		id.push(Math.random().toString().substring(2,6));
	}
	var filename = object.filename || Math.random().toString().substring(2);
	id.push(filename);
	id = id.join("-");
	var extension = filename.match(/\.[^\.]+$/);
	if(object["content-type"] && object["content-type"] !== MIME_TYPES[extension && extension[0]]){
		if(object.filename || !REVERSE_MIME_TYPES[object["content-type"]]){
			id += "_ " + object["content-type"].replace(/[^\w-]/,'~');
		}else{
			id += REVERSE_MIME_TYPES[object["content-type"]];
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

function ensurePath(path){
	var index = path.lastIndexOf('/');
	if(index === -1){
		return;
	}
	var path = path.substring(0, index);
	try{
		fs.statSync(path);
	}catch(e){
		ensurePath(path);
		fs.mkdirSync(path, 0777);
	}
}
