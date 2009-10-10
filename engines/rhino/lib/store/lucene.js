var extendForEach = require("util/lazy").extendForEach;
var Lucene = exports.Lucene = function(store, name){
	searcher = new org.persvr.store.LuceneSearch(name);
	var defaultPut = store.put;
	store.put = function(object, id){
		id = defaultPut.call(store, object, id);
		searcher.remove(id);
		searcher.create(id, object);
		return id;
	};
	store.fulltext = function(query, options){
		return extendForEach(searcher.query(query, options.start || 0, options.end || 100000000, null));
	}
	var defaultCommitTransaction = store.commitTransaction;
	store.commitTransaction = function(){
		defaultCommitTransaction.call(store);
		searcher.commitTransaction();
	}
	return store;
};

