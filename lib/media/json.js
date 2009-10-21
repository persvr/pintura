/**
 * Registers JSON media type handling
 */
var JSONExt = require("json-ext"),
	Media = require("media").Media;

Media({
	mediaType:"application/json",
	getQuality: function(object){
		return 0.8;
	},
	serialize: StreamingSerializer(JSON.stringify),
	deserialize: function(inputStream, env){
		return JSONExt.parse(inputStream.read().decodeToString("UTF-8"));
	}
});

exports.StreamingSerializer = StreamingSerializer; 
function StreamingSerializer(stringify){
	return function(object, env){
		return {
			forEach:function(write){
				if(object instanceof Array){
					// this is a CSRF protection mechanism to guard against JSON hijacking
					if(env.crossSiteForgeable){
						write("{}&&");
					}
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
						write(stringify(item));
					});
					write("]");
				}
				else {
					write(stringify(object));
				}
			}
		};
	}
}
