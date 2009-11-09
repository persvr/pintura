var extendSome = require("../util/lazy").extendSome;
var FullText = exports.FullText = function(store, name){
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
		return extendSome({
			some: function(callback){
				idResults.some(function(id){
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
		if(defaultCommitTransaction){
			defaultCommitTransaction.call(store);
		}
		searcher.commitTransaction();
	}
	var defaultDelete = store["delete"];
	store["delete"] = function(id){
		defaultDelete.call(store, id);
		searcher.remove(id);
	};
	return store;
};

var QueryRegExp = require("../json-query").QueryRegExp;

var FullTextRegExp = exports.FullTextRegExp = QueryRegExp(/(\?|&)fulltext\($value\)(&)?/);
exports.JsonQueryToFullTextSearch = function(tableName, indexedColumns){
	return function(query, options){
		if((matches = query.match(FullTextRegExp))){
			print(matches);
			if(matches[1] == "&" || matches[3] == "&"){
				//TODO: convert the rest of the query to a lucene search
				return;
			}
			return eval(matches[2]);
		}
	};
};