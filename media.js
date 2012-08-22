/**
 * This module provides the basic mechanism for interfacing between format/representations
 * and resources, providing deserialization and serialization capabilities. This module
 * performs the content negotiation for choosing the appropriate media type.
 */

var model = require("perstore/model"),
	when = require("promised-io/promise").when,
	Media = exports.Media = function(media){
		return Media.instances[media.mediaType] = media;
	};

Media.instances = {};
Media.optimumMedia = function(source, acceptTypeHeader){
	var bestMedia = null, bestParameters;
	var bestQuality = 0;
	if(acceptTypeHeader==null){
		acceptTypeHeader = "*/*";
	}
	var acceptTypes = acceptTypeHeader.split(/\s*,\s*/);
	for(var i = 0;i < acceptTypes.length; i++){
		var acceptType = acceptTypes[i];
		var parts = acceptType.split(/\s*;\s*/);
		var type = parts[0];
		var clientQuality = 1;
		var parameters = {};
		for(var j = 1; j < parts.length; j++){
			var part = parts[j];
			var equalIndex = part.indexOf("=");
			parameters[part.substring(0, equalIndex)] = part.substring(equalIndex + 1);
		}
		clientQuality = +(parameters.q || 1);

		if("*/*" == type){
			for(var instanceType in Media.instances){
				checkMedia(Media.instances[instanceType]);
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
		// use alternates per http://tools.ietf.org/html/draft-ietf-http-alternates-01
		var alternates;
		if(source && ((typeof source.getMetadata === "function" && (alternates = source.getMetadata().alternates)) || (source._metadata && (alternates = source._metadata.alternates)))){
			if(!(alternates instanceof Array)){
				alternates = [alternates];
			}
			alternates.forEach(function(alternate){
				var mediaType = alternate["content-type"];
				if("*/*" == type || mediaType == type){;
					checkMedia({
						serialize: function(){
							return {
								// loadFile could return a promise
								forEach: function(each){
									return when(exports.loadFile(alternate), function(file){
										file.forEach(each);
									});
								}
							};
						},
						getQuality: function(){
							return +(alternate.q || 0.5);
						},
						mediaType: mediaType
					});
				}
			});
		}
	}
	function checkMedia(media){
		var quality = clientQuality * media.getQuality(source);
		if(source && source["content-type"] == media.mediaType){
			quality += 0.5;
		}
		if(quality > bestQuality){
			bestMedia = media;
			bestParameters = parameters;
			bestQuality = quality;
		}
	}
	return bestMedia && {media: bestMedia, parameters: bestParameters};
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

// TODO move to promised-io/lazy-array
exports.forEachableToString = function(input){
	if (typeof input === "string") return input;
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

exports.saveFile = function(file, directives){
	var metadata = {};
	for(var i in file){
		if(typeof file[i] == "string"){
			metadata[i] = file[i];
		}
	}
	return when(exports.getFileModel().put(file, directives), function(result){
		var id = result.id || result;
		result = {id: id};
		Object.defineProperty(result, "getMetadata",{
			value: function(){
				return metadata;
			},
			enumerable: false
		});
		return result;
	});
};
exports.loadFile = function(file, directives){
	return exports.getFileModel().get(file.id, directives);
};
