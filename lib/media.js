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
					var media = Media.instances[i];
					var quality = clientQuality + media.getQuality(source);
					if(quality > bestQuality){
						bestMedia = media;
						bestQuality = quality;
						bestType = media.contentType; 
					}
				};
			}
			else{
				var media = Media.instances[type];
				if(media){
					var quality = clientQuality + media.getQuality(source);
					if(quality > bestQuality){
						bestMedia = media;
						bestQuality = quality;
						bestType = media.contentType; 
					}
				}
			}
		}
		return bestMedia;
	};

/*Media({
	mediaType:"* /*",
	getQuality: function(object){
		return 0;
	},
	serialize: function(object, env, response){
		response.status = 406;
		return "No acceptable MIME type was specified in the Accept header, it is recommended that you include * /* in the Accept header to get the best representation."
	},
	deserialize: function(inputStream, env){
		
	}
});*/
require("media/json");
require("media/javascript");
require("media/urlencoded");
require("media/atom");

Media({
	mediaType:"multipart/*",
	getQuality: function(object){
		return 0.2;
	},
	serialize: function(object, env, response){
		response.status = 406;
		return "No acceptable MIME type was specified in the Accept header, it is recommended that you include */* in the Accept header to get the best representation."
	},
	deserialize: function(inputStream, env){
		
	}
});
