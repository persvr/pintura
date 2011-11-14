/**
 * Registers JSON media type handling
 */
var JSONExt = require("perstore/util/json-ext"),
	Media = require("../media").Media,
	when = require("promised-io/promise").when,
	forEachableToString = require("../media").forEachableToString;

Media({
	mediaType:"application/json",
	getQuality: function(object){
		return 0.8;
	},
	serialize: StreamingSerializer(JSON.stringify),
	deserialize: function(inputStream, request){
		return when(forEachableToString(inputStream), JSONExt.parse);
	}
});

exports.StreamingSerializer = StreamingSerializer;
function StreamingSerializer(stringify){
	return function(object, parameters, request){
		return {
			forEach:function(write){
				if(object && typeof object.forEach === "function" && !object.forEach.binary){
					// this is a CSRF protection mechanism to guard against JSON hijacking
					if(request.crossSiteForgeable){
						write("{}&&");
					}
					// progressively stream arrays for better performance and memory
					write("[")
					var first = true;
					var undefined; // make it a fast, closely-scoped lookup
					return when(object.forEach(function(item){
						if(first){
							first = false;
						}
						else{
							write(",");
						}
						if(item === undefined || typeof item === "function"){
							// can't do undefined in JSON
							write("null");
						}else{
							write(stringify(item));
						}
					}), function(){
						write("]");
					});
				}else if(object == undefined){
					write("null");
				}else{
					write(stringify(object));
				}
			}
		};
	}
}
