exports.Media = function Media(props){
	Object.clone(props, this);
	Media.instances[this.mediaType] = this;
};
Media.instances = {};
Media.optimumMedia = function(source, acceptTypeHeader){
		var bestMedia = null;
		var bestQuality = 0;
		var bestType = null;
		if(acceptTypeHeader==null)
			acceptTypeHeader = "*/*";
		var acceptTypes = acceptTypeHeader.split(/\s*,\s*/);
		for each (var acceptType in acceptTypes){
			var parts = acceptType.split(/\s*;\s*/);
			var type = parts[0];
			var clientQuality = 1;
			for each(var part in parts){
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
		return bestMedia || org.persvr.remote.DataSerializer.findMedia(source, acceptTypeHeader, true);
	};

Media({
	mediaType:"application/json",
	getQuality: function(object){
		return 0.9;
	},
	serialize: function(object, env){
		return {
			forEach:function(callback){
				new JSONSerializer().serialize(object, callback);
			}
		};
	},
	deserialize: function(inputStream, env){
		
	}
});
Media({
	mediaType:"application/javascript",
	getQuality: function(object){
		return 0.9;
	},
	serialize: function(object, env){
		return {
			forEach:function(callback){
				new JavaScriptSerializer().serialize(object, callback);
			}
		};
	},
	deserialize: function(inputStream, env){
		
	}
});
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
Media({
	mediaType:"application/x-www-form-urlencoded",
	getQuality: function(object){
		return 0.1;
	},
	serialize: function(object, env, response){
		response.status = 406;
		return "No acceptable MIME type was specified in the Accept header, it is recommended that you include */* in the Accept header to get the best representation."
	},
	deserialize: function(inputStream, env){
		
	}
});
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
