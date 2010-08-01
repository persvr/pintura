/**
 * This module provides the basic mechanism for interfacing between format/representations
 * and resources, providing deserialization and serialization capabilities. This module
 * performs the content negotiation for choosing the appropriate media type.
 */

var model = require("perstore/model"),
	when = require("promised-io/promise").when,
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
			if(source && typeof source.getMetadata === "function" && (alternates = source.getMetadata().alternates)){
				if(!(alternates instanceof Array)){
					alternates = [alternates];
				}
				alternates.forEach(function(alternate){
					checkMedia({
						serialize: function(){
							return alternate;
						},
						getQuality: function(){
							return 1;
						},
						mediaType: alternate.getMetadata()["content-type"]
					});
				});
			}
			/* for persvr compatibility:
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
			/* for persvr compatibility:
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
	require('rql/parser').parseQuery(request.queryString).args.forEach(function(term){
		if (term.name === 'select' || term.name === 'values') {
			columns = term.args;
		}
	});
	// no (valid) ?select(...) -> dump all properties
	if (columns.length === 0 && item && typeof item === 'object')
		columns = Object.keys(item);
	return columns;
}

exports.forEachableToString = function(input){
	var strings = [];
	return when(input.forEach(function(block){
		strings.push(block);
	}), function(){
		return strings.join("");
	});
};
var fileModel;
exports.getFileModel = function(){
	if(!fileModel){
		var Model = require("perstore/model").Model;
		fileModel = Model(require("perstore/store/filesystem").FileSystem({dataFolder:"files"}), exports.fileSchema);
	}
	return fileModel;
};
exports.setFileModel = function(value){
	fileModel = value;
};
exports.fileSchema = {};

exports.onFile = function(file, directives){
	file.isFile = true;
	return when(exports.getFileModel().put(file, directives), function(file){
		file = file.id || file;
		return {$ref:file};
	});
};
