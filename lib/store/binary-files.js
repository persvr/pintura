/**
 * Storage of binary files
 */
exports.BinaryFiles = function(path){
	return {
		get: function(id){
			if(id.match(/\W/)){
				throw new Error("Invalid ID");
			}
			var filePath = path + id.substring(0,2) + '/' + id.substring(2,4) + '/' + id.substring(4,6) + '/' + id.substring(6,8);
			var meta = JSON.parse(File.read(filePath + ".meta"));
			meta.content = File.read(filePath + ".content");
			return meta;
		},
		put: function(object){
			
		}
	};
};