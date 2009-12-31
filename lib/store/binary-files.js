/**
 * Storage of static binary files
 */
var mime = require("jack/mime");
exports.BinaryFiles = function(path){
	return {
		get: function(id){
			if(id.match(/\W/)){
				throw new Error("Invalid ID");
			}
			var filePath = path + id.substring(0,2) + '/' + id.substring(2,4) + '/' + id.substring(4,6) + '/' + id.substring(6,8);
			var object = new BinaryFile();
			//TODO: maybe put this on the prototype so it is not enumerated
			object.serialize = function(){
				return File.read(filePath);
			};
			object.alternate = object;
			object["x-sendfile"] = filePath;
			var extension = file.extension(filePath);
            object["content-type"] = mime.mimeType(extension, extension.replace(/_/,'/'));
            object["content-disposition"] = "attachment; filename=" + filePath;
            object["content-length"] = "0"//String(file.size(path));
			return object;
		},
		put: function(object){
			
		}
	};
};
function BinaryFile(){
}
BinaryFile.prototype.getMetadata = function(){
	// TODO: copy all properties except "serialize" and "getMetadata" 
	return this;
};