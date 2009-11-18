var extendSome = require("lazy").extendSome;
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

var parseQuery = require("../url-object-query").parseQuery;

exports.JsonQueryToFullTextSearch = function(tableName, indexedColumns){
	return function(query, options){
		query = parseQuery(query);
		var fulltext, extra = "";
		query.children.forEach(function(child){
			if(child.type == "call" && child.method == "fulltext"){
				fulltext = child.children[0];
				print(fulltext);
			}
			if(child.type == "comparison"){
				extra += " AND " + child.name + ":" + child.value;
			}
		});
		return fulltext && (fulltext + extra);
	};
};
