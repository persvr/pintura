/**
 * Registers JavaScript media type handling
 */
var JSONExt = require("../json-ext"),
	StreamingSerializer = require("./json").StreamingSerializer,
	Media = require("../media").Media;

Media({
	mediaType:"application/javascript",
	getQuality: function(object){
		return 0.9;
	},
	serialize: StreamingSerializer(JSONExt.stringify),
	deserialize: function(inputStream, env){
		return JSONExt.parse(inputStream.read().decodeToString("UTF-8"));
	}
});