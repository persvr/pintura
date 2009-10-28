var extendForEach = require("../util/lazy").extendForEach;
var Lucene = exports.Lucene = function(store, name){
	searcher = new org.persvr.store.LuceneSearch("lucene/" + name);
	var defaultPut = store.put;
	store.put = function(object, id){
		id = defaultPut.call(store, object, id);
		searcher.remove(id);
		searcher.create(id, object);
		return id;
	};
	store.fulltext = function(query, field, options){
		var idResults = searcher.query(query, field, options.start || 0, options.end || 100000000, null)
		return extendForEach({
			forEach: function(callback){
				idResults.forEach(function(id){
					try{
						callback(store.get(id));
					}
					catch(e){
						print(e.message);	
					}
				});
			},
			totalCount: idResults.totalCount
		});
	};
	var defaultCommitTransaction = store.commitTransaction;
	store.commitTransaction = function(){
		defaultCommitTransaction.call(store);
		searcher.commitTransaction();
	}
	return store;
};

