exports.extendSome = function(hasSomeAndLength){
	return new SomeWrapper(hasSomeAndLength);
};

var done = {};
function SomeWrapper(hasSomeAndLength){
	this.source = hasSomeAndLength;
	this.length= hasSomeAndLength.length;
	this.totalCount = hasSomeAndLength.totalCount;
}
SomeWrapper.prototype = [];
SomeWrapper.prototype.some = function(callback){
	this.source.some(callback);
}
SomeWrapper.prototype.filter = function(fn, thisObj){
	var result = [];
	this.source.some(function(item){
		if(fn.call(thisObj, item)){
			results.push(item);
		}
	});
	return results;
};

SomeWrapper.prototype.every = function(fn, thisObj){
	return !this.source.some(function(item){
		if(!fn.call(thisObj, item)){
			return true;
		}
	});
};
SomeWrapper.prototype.forEach= function(fn, thisObj){
	this.source.some(function(item){
		fn.call(thisObj, item);
	});
};
SomeWrapper.prototype.concat = function(someOther){
	var source = this.source;
	return new SomeWrapper({
		length : source.length + someOther.length,
		some : function(fn,thisObj){
			return source.some(fn,thisObj) ||
				someOther.some(fn,thisObj);
		}
	});
};
SomeWrapper.prototype.map = function(mapFn, mapThisObj){
	var source = this.source;
	return new SomeWrapper({
		length : source.length,
		some : function(fn,thisObj){
			source.some(function(item){
				fn.call(thisObj, mapFn.call(mapThisObj, item));
			});
		}
	});
};
SomeWrapper.prototype.first = function(){
	return this.get(0);
};
SomeWrapper.prototype.last = function(){
	return this.get(this.length-1);
};
SomeWrapper.prototype.get = function(index){
	var result, i = 0;
	this.source.some(function(item){
		if(i == index){
			result = item;
			return true;
		}
		i++;
	});
	return result;
};

SomeWrapper.prototype.toSource = function(){
	var serializedParts = [];
	this.source.some(function(item){
		serializedParts.push(item && item.toSource());
	});
	return '[' + serializedParts.join(",") + ']';
};
SomeWrapper.prototype.toJSON = function(){
	var loadedParts = [];
	this.source.some(function(item){
		loadedParts.push(item);
	});
	return loadedParts;
};




exports.extendForEach = function(hasForEachAndLength){
	return new SomeWrapper(hasForEachAndLength);
};

var done = {};
function ForEachWrapper(hasForEachAndLength){
	this.source = hasForEachAndLength;
	this.length= hasForEachAndLength.length;
	this.totalCount = hasForEachAndLength.totalCount;
}
ForEachWrapper.prototype = [];
ForEachWrapper.prototype.forEach = function(callback){
	this.source.forEach(callback);
}
ForEachWrapper.prototype.filter = function(fn, thisObj){
	var result = [];
	this.source.forEach(function(item){
		if(fn.call(thisObj, item)){
			results.push(item);
		}
	});
	return results;
};

ForEachWrapper.prototype.every = function(fn, thisObj){
	try{
		this.source.forEach(function(item){
			if(!fn.call(thisObj, item)){
				throw done;
			}
		});
		return true;
	}catch(e){
		if(e == done){
			return false;
		}
		throw e;
	}
};
ForEachWrapper.prototype.some = function(fn, thisObj){
	try{
		this.source.forEach(function(item){
			if(fn.call(thisObj, item)){
				throw done;
			}
		});
		return false;
	}catch(e){
		if(e == done){
			return true;
		}
		throw e;
	}
};
ForEachWrapper.prototype.concat = function(someOther){
	var source = this.source;
	return new ForEachWrapper({
		length : source.length + someOther.length,
		forEach : function(fn,thisObj){
			source.forEach(fn,thisObj);
			someOther.forEach(fn,thisObj);
		}
	});
};
ForEachWrapper.prototype.map = function(mapFn, mapThisObj){
	var source = this.source;
	return new ForEachWrapper({
		length : source.length,
		forEach : function(fn,thisObj){
			source.forEach(function(item){
				fn.call(thisObj, mapFn.call(mapThisObj, item));
			});
		}
	});
};
ForEachWrapper.prototype.first = function(){
	return this.get(0);
};
ForEachWrapper.prototype.last = function(){
	return this.get(this.length-1);
};
ForEachWrapper.prototype.get = function(index){
	try{
		var result, i = 0;
		this.source.forEach(function(item){
			if(i == index){
				result = item;
				throw done;
			}
			i++;
		});
		return result;
	}catch(e){
		if(e == done){
			return result;
		}
		throw e;
	}
};

ForEachWrapper.prototype.toSource = function(){
	var serializedParts = [];
	this.source.forEach(function(item){
		serializedParts.push(item && item.toSource());
	});
	return '[' + serializedParts.join(",") + ']';
};
ForEachWrapper.prototype.toJSON = function(){
	var loadedParts = [];
	this.source.forEach(function(item){
		loadedParts.push(item);
	});
	return loadedParts;
};
var deepBeget = exports.deepBeget = function(object){
	var derivative = Object.create(object);
	for(var i in object){
		var value = object[i];
		if(value && typeof value =='object'){
			(function(value){
				Object.defineProperty(derivative, i, {
					get: function(){
						deepBeget(value);
					}	
				});
			})(value);			
		}
		if(typeof value =='function'){
			(function(value){
				derivative[i] = function(){
					return value.apply(this, arguments); 
				}
			})();
		}
	}
};


function FromIterator(iterable){
	this.__iterator__ = iterable.iterator;
	this.length = iterable.length;
};
FromIterator.prototype = [];
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
FromIterator.prototype.forEach = iterate(function(){
	doIt(function(){
	});
});
FromIterator.prototype.map = iterate(function(doIt){
	var results;
	doIt(function(result){
		results.push(result);
	});
	return results;
});
FromIterator.prototype.filter = iterate(function(doIt){
	var results;
	doIt(function(result, item){
		if(result){
			results.push(item);
		}
	});
	return results;
});
FromIterator.prototype.reduce = iterate(function(doIt){
	var results;
	doIt(function(result){
	});
	return results;
});
