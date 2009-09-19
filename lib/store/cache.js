/**
 * This will be a wrapper store that can add caching to a store
 */
var table = {};
exports.Cache = function(store){
	return {
		startTransaction: function(){
			var transaction = store.startTransaction();
			return {
				get: function(id){
					return transaction.get[id];
				}
			};
		}
	};
};