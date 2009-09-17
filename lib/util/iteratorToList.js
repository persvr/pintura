function LazyArray(iterable){
	this.__iterator__ = iterable.iterator;
	this.length = iterable.length;
};
LazyArray.prototype = [];
function iterate(doIt){
	return function(callback){
		doIt(function(result){
			var iterator = this.__iterator__();
			var next;
			var i = 0;
			try{
				if(iterator.hasNext){
					while(iterator.hasNext()){
						next = iterator.next();
						result(callback(next, i++), next);
					}
				}
				else{
					while((next = iterator.next()) !== undefined){
						result(callback(next, i++), next);
					}
				}
			}
			catch(e){
				if(!(typeof StopIteration == "object" && e instanceof StopIteration)){
					throw e;
				}
			}
			finally{
				if(iterator.close){
					iterator.close();
				}
			}
		});
	};
};
LazyArray.prototype.forEach = iterate(function(){
	doIt(function(){
	});
});
LazyArray.prototype.map = iterate(function(doIt){
	var results;
	doIt(function(result){
		results.push(result);
	});
	return results;
});
LazyArray.prototype.filter = iterate(function(doIt){
	var results;
	doIt(function(result, item){
		if(result){
			results.push(item);
		}
	});
	return results;
});
LazyArray.prototype.reduce = iterate(function(doIt){
	var results;
	doIt(function(result){
	});
	return results;
});
exports.iteratorToArray = function(){
	return new LazyArray(iterator);
};