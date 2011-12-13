/**
 * Provides the request as the context (across async promises)
 */
var promiseModule = require("promised-io/promise");
var SetContext = function(vars, nextApp){
	return function(request){
		try{
			promiseModule.currentContext = request.context = ((typeof vars === 'function') ? vars(request) : vars) || {};
			return nextApp(request);
		}
		finally{
			promiseModule.currentContext = null;
		}
	};
};
SetContext.SetContext = SetContext;
module.exports = SetContext;