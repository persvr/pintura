/**
 * Storage of static binary files
 */
var fs = require("fs-promise"),
	mime = require("jack/mime"),
	when = require("promise").when;
exports.depth = 1; // depth of file directory paths to use 
exports.BinaryFiles = function(path){
	var count = 0;
	return {
		get: function(id){
			if(id.match(/[\W-]/)){
				throw new Error("Invalid ID");
			}
			var parts = id.split("_", 3);
			var filePath = path + '/' + parts[0].replace(/-/g,'/') + id.substring(parts[0].length);
			var object = new BinaryFile();
			//TODO: maybe put this on the prototype so it is not enumerated
			object.forEach = function(callback){
				// TODO: read the file in blocks for better scalability
				require("sys").puts("read");
				var resultPromise = fs.readFileSync(filePath);
				callback(resultPromise);
				//resultPromise.then(callback);
				return resultPromise;
			};
			var filename = parts[1];
			var extension = filename.match(/\.[^\.]+$/);
			object.alternates = object;
            object["content-type"] = parts[2] ? parts[2](/~/g,'/') : mime.MIME_TYPES[extension];
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
			require("sys").puts(new Error().stack);
			count++;
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
				require("sys").puts("writeFile");
				return fs.open(filePath, "w", 0666).then(function(fd){
						require("sys").puts("opened");
					return when(object.forEach(function(buffer){
						require("sys").puts("writing");
						fs.write(fd, buffer, 0, buffer.length, null);
					}), function(){
						fs.close(fd);
					});
				});
			}
		}
	};
};
function generateId(object){
	var id = object["content-disposition"]  == "attachment" ? ["a" + Math.random().toString().substring(2,6)] : [Math.random().toString().substring(2,6)];
	for(var i = 1; i < exports.depth; i++){
		id.push(Math.random().toString().substring(2,6));
	}
	var filename = object.filename || Math.random().toString().substring(2);
	id.push(filename);
	id = id.join("-");
	var extension = filename.match(/\.[^\.]+$/);
	if(object["content-type"] && object["content-type"] !== mime.MIME_TYPES[extension && extension[0]]){
		id += "_ " + object["content-type"].replace(/[^\w-]/,'~');
	}
	require("sys").puts("generated id " + id);  
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
