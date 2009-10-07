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
		return bestMedia || org.persvr.remote.DataSerializer.findMedia(source, acceptTypeHeader, true);
	};

Media({
	mediaType:"application/json",
	getQuality: function(object){
		return 0.9;
	},
	serialize: function(object, env){
		return {
			forEach:function(write){
				if(object instanceof Array){
					// progressively stream arrays for better performance and memory
					write("[")
					var first = true;
					object.forEach(function(item){
						if(first){
							first = false;
						}
						else{
							write(",");
						}
						write(JSON.stringify(item));
					});
					write("]");
				}
				else {
					write(JSON.stringify(object));
				}
			}
		};
	},
	deserialize: function(inputStream, env){
		return JSON.parse(inputStream.read().decodeToString("UTF-8"));
	}
});
Media({
	mediaType:"application/javascript",
	getQuality: function(object){
		return 0.9;
	},
	serialize: ({}).toSource ?
		// we will use toSource if it is available 
		function(object, env){
			return {
				forEach:function(write){
					function writeValue(value, topLevel){
						if(value && typeof value == "object" || typeof value == "function"){
							var source = value.toSource();
							if(source.charAt(0) == "(" && !topLevel){
								// remove the surrounding paranthesis that are produced
								source = source.substring(1, source.length - 1);
							}
						}
						else if(typeof value == "number" || typeof value == "undefined"){
							// could be NaN or Infinity
							var source = ({a:value}).toSource();
							source = source.substring(4, source.length - 2);
						}
						else{
							source = JSON.stringify(value);
						}
						write(source);
						
					}
					if(object instanceof Array){
						// progressively stream arrays for better performance and memory
						object.forEach(function(item){
							writeValue(item);
						});
					}
					else {
						writeValue(object, true);
					}
				}
			};
		} :
		function(object, env){
			return {
				forEach:function(write){
					function replacer(value){
						
					}
					if(object instanceof Array){
						// progressively stream arrays for better performance and memory
						object.forEach(function(item){
							write(JSON.stringify(item, replacer));
						});
					}
					else {
						write(JSON.stringify(object, replacer));
					}
				}
			};
			
		},
	deserialize: function(inputStream, env){
		return JSON.parse(inputStream.read().toString());
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
