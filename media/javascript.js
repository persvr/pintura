/**
 * Registers JavaScript media type handling
 */
var JSONExt = require("perstore/util/json-ext"),
	StreamingSerializer = require("./json").StreamingSerializer,
	when = require("promised-io/promise").when,
	Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString,
	serializer = StreamingSerializer(JSONExt.stringify);
var lookForProperties = exports.lookForProperties = ["totalCount"];
Media({
	mediaType:"application/javascript",
	getQuality: function(object){
		return 0.9;
	},
	serialize: function(value, parameters, request){
		if(value instanceof Array){
			for(var i = 0, l = lookForProperties.length; i < l; i++){
				if(value[lookForProperties[i]]){
					// we found a property to attach to the array
					return {
						forEach: function(write){
							write("(function(){var v=");
							return when(serializer(value, parameters, request).forEach(write), function(){
								for(var i = 0, l = lookForProperties.length; i < l; i++){
									var prop = lookForProperties[i]; 
									if(value[prop]){
										write(";v." + prop + "=" + JSONExt.stringify(value[prop]));
									}
								}
								write(";return v;})()");
							});
						} 
					};
				}
			}
		}
		return serializer(value, parameters, request);
	},
	deserialize: function(inputStream, parameters, request){
		return JSONExt.parse(forEachableToString(inputStream));
	}
});
