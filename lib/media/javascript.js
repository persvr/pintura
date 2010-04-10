/**
 * Registers JavaScript media type handling
 */
var JSONExt = require("commonjs-utils/json-ext"),
	StreamingSerializer = require("./json").StreamingSerializer,
	Media = require("../media").Media,
	forEachableToString = require("../media").forEachableToString;

Media({
	mediaType:"application/javascript",
	getQuality: function(object){
		return 0.9;
	},
	serialize: StreamingSerializer(JSONExt.stringify),
	deserialize: function(inputStream, request){
		return JSONExt.parse(forEachableToString(inputStream));
	}
});
