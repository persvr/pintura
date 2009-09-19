/**
 * This will be an in-memory store
 */
var table = {};
exports.memory = {
	startTransaction: function(){
		return {
			get: function(id){
				return table[id];
			}
		};
	}
};