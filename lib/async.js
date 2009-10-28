/**
 * A library for leveraging generator syntax to making promises easier to work with. 
 * This is not a core dependency of Pintura.
 * Example usage:
 * 
var async = require("./async").async;

sleep = function(time){
    var future = new Future();
    setTimeout(future.fulfill, time);
    return future;
};

// some examples
sleepAndAdd4 = async(function(num){
    yield sleep(1000);
    returns = num + 4;
});

add5 = async(function(num){
    var sum = yield sleepAndAdd4(num + 1);
    console.log("sum " + sum);
    returns = sum;
});

var add5Promise = add5(10);

sleepAndAdd4(10).addCallback(function(value){
    console.log("callback the manual way " + value);
});
  
 */
 
var Promise = require("promise").Promise; 
 // the async library
exports.async = function(generatorFunction){
    return function(){
        var generator;
        var future = new Future();
        function finish(value){
                finished = true;
                callbacks.forEach(function(callback){
                    callback(returnValue);
                });
        }
        function executeUntilYield(value){
            try{
                while(true){
                    returns = undefined;
                    value = generator[value === undefined ? "next" : "send"](value);
                    if(value instanceof Promise){
                        value.addCallback(function(next){
                            return executeUntilYield(next);
                        });
                        break;
                    }
                }
            }
            catch(e if StopIteration){
                future.fulfill(returns);
            }
           
        }
        generator = generatorFunction.apply(this, arguments);
        if(Object.prototype.toString.call(generator) == "[object Generator]"){
            executeUntilYield();
        }else{
            future.fulfill(generator);
        }
        return future.promise;
    }
};
