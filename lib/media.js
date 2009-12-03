/**
 * This module provides the basic mechanism for interfacing between format/representations
 * and resources, providing deserialization and serialization capabilities. This module
 * performs the content negotiation for choosing the appropriate media type.
 */
var Media = exports.Media = function(media){
	Media.instances[media.mediaType] = media;
};
Media.instances = {};
Media.optimumMedia = function(source, acceptTypeHeader){
	var bestMedia = null;
	var bestQuality = 0;
	var bestType = null;
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
			for(var i in source){
				if(i.substring(0,15) == "representation:"){
					checkMedia(source[i]);
				}
			}
		}
		else{
			var media = Media.instances[type];
			if(media){
				checkMedia(media);
			}
			media = source && source["representation:" + type]; 
			if(media){
				checkMedia(media);
			}
		}
	}
	function checkMedia(media){
		var quality = clientQuality * media.getQuality(source);
		if(quality > bestQuality){
			bestMedia = media;
			bestQuality = quality;
			bestType = media.mediaType; 
		}
	}
	return bestMedia;
};

// load the default media types
require("./media/json");
require("./media/javascript");
require("./media/url-encoded");
require("./media/atom");
require("./media/multipart-form-data");
require("./media/html");
require("./media/uri-list");
require("./media/plain");