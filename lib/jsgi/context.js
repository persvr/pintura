/**
 * Provides the request as the context (across async promises)
 */
var promiseModule = require("promised-io/promise");
var copy = require("commonjs-utils/copy").copy;

exports.SetContext= function(vars, nextApp){
    return function(request){
        try{
            var startingContext = copy(((typeof vars === 'function') ? vars(request) : vars) || {} , {});
            promiseModule.currentContext = request.context = startingContext;
            return nextApp(request);
        } finally{
            if(promiseModule.currentContext && 
                promiseModule.currentContext.suspend && 
                typeof promiseModule.currentContext.suspend == "function"){
                promiseModule.currentContext.suspend();
            }
            promiseModule.currentContext = null;
        }
    };
};
