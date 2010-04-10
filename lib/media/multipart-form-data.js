/**
 * Registers multi-part media type handling
 */
var parseMultipart = require("../jsgi/multipart").parseMultipart,
	stringToValue = require("./auto-type").stringToValue,
	Media = require("../media").Media,
	file = require("file"),
	MIME_TYPES = require("jack/mime").MIME_TYPES;
	
Media({
	mediaType:"multipart/form-data",
	getQuality: function(object){
		return 0.2;
	},
	serialize: function(object, request){
		var boundary = Math.random().toString().substring(2);
		return {
			forEach:function(write){
				for(var i in object){
					if(object.hasOwnProperty(i)){
						write("--" + boundary + '\n');
						write("Content-Disposition: form-data; name=" + i + "\n\n" + object[i] + '\n');
					}
				}
				write("--" + boundary + '--\n\n');
			},
			"content-type": "multipart/form-data; boundary=" + boundary, 
		}
	},
	deserialize: function(inputStream, request){
		var deserialized = parseMultipart(request, {
			uploadedFilepath: function(filename, contentType){
				for(var i in MIME_TYPES){
					if(MIME_TYPES[i] == contentType){
						contentType = i.substring(1);
						break;
					}
				}
				return filename;// + '__' + contentType.replace(/\//,'_');
			}
		});
		for(var i in deserialized){
			var value = deserialized[i];
			if(value && typeof value === "object"){
				deserialize[i] = exports.onFile(value);
			}
			else{
				deserialize[i] = stringToValue(value);
			}
		}
		return deserialized;
	}
});
exports.File = function(){};
var open = require("file").open;
exports.File.prototype.getFile = function(){
	return open(this.filename, 'r'); 
}
exports.onFile = function(fileObject){
	var typedObject = new exports.File();
	for(var i in fileObject){
		typedObject[i] = fileObject;
	}
	return typedObject;
}
/*

	if(!exports.fileStore){
		// TODO: Where should this go?
		exports.fileStore = require("perstore/stores").openObjectStore("File");
	}
	exports.fileStore.create(fileObject);
	return fileObject;
	*/
