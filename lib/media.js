/**
 * This module provides the basic mechanism for interfacing between format/representations
 * and resources, providing deserialization and serialization capabilities. This module
 * performs the content negotiation for choosing the appropriate media type.
 */

var model = require("perstore/model"),
	Media = exports.Media = function(media){
		Media.instances[media.mediaType] = media;
	};

Media.instances = {};
Media.optimumMedia = function(source, acceptTypeHeader){
	var bestMedia = null;
	var bestQuality = 0;
	if(acceptTypeHeader==null)
		acceptTypeHeader = "*/*";
	var acceptTypes = acceptTypeHeader.split(/\s*,\s*/);
	for(var i = 0;i < acceptTypes.length; i++){
		var acceptType = acceptTypes[i];
		var parts = acceptType.split(/\s*;\s*/);
		var type = parts[0];
		var clientQuality = 1;
		for(var j = 0; j < parts.length; j++){
			var part = parts[j];
			if(part.substring(0,2) == "q="){
				clientQuality = parseFloat(part.substring(2)) || 0;
			}
		}
		if("*/*" == type){
			for(var i in Media.instances){
				checkMedia(Media.instances[i]);
			}
			// use alternates per http://tools.ietf.org/html/draft-ietf-http-alternates-01
			var alternates;
			if(source && typeof source.getMetadata === "function" && (alternates = source.getMetadata().alternate)){
				if(!(alternates instanceof Array)){
					alternates = [alternates];
				}
				alternates.forEach(function(alternate){
					// TODO: parse for quality
					bestMedia = {
						serialize: function(){
							return alternate.serialize();
						},
						mediaType: alternate.getMetadata()["content-type"] 
					}
				});
			}
			/* for persvr compatibilty:
			for(var i in source){
				if(i.substring(0,15) == "representation:"){
					checkMedia(source[i]);
				}
			}*/
		}
		else{
			var media = Media.instances[type];
			if(media){
				checkMedia(media);
			}
			/* for persvr compatibilty:
			media = source && source["representation:" + type]; 
			if(media){
				checkMedia(media);
			}*/
		}
	}
	function checkMedia(media){
		var quality = clientQuality * media.getQuality(source);
		if(quality > bestQuality){
			bestMedia = media;
			bestQuality = quality;
		}
	}
	return bestMedia;
};

exports.getColumnsToExport = function(request, item){
	var columns = [];
	// honor possible ?select(prop1,prop2,...)
	require('perstore/resource-query').parseQuery(request.queryString).args.forEach(function(term){
		if (term.name == 'select') {
			columns = [];
			term.args.forEach(function(f){
				if (typeof item !== 'object' || item.hasOwnProperty(f))
					columns.push(f);
			});
		}
	});
	// no (valid) ?select(...) -> dump all properties
	if (columns.length == 0 && item) {
		if (typeof item !== 'object') item = {unnamed: item};
		for (var i in item) if (item.hasOwnProperty(i)) {
			columns.push(i);
		}
	}
	return columns;
}

exports.forEachableToString = function(input){
	var strings = [];
	input.forEach(function(block){
		strings.push(block);
	});
	return strings.join("");
};

exports.onFile = function(file){
	var FileModel;
	try{
		FileModel = model.openObjectStore("File");
	}catch(e){
		model.classModel.put({id:"File"}, {store: 'require("pintura/store/binary-files").BinaryFiles("data/files")'})
		FileModel =  model.openObjectStore("File");
	}
	file.isFile = true;
	return FileModel.put(file);
};
