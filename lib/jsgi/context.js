/**
 * Provides the request as the context (across async promises)
 */
var promiseModule = require("promised-io/promise");
exports.SetContext= function(nextApp){
	return function(request){
		try{
			promiseModule.currentContext = request.context = {};
			return nextApp(request);
		}
		finally{
			promiseModule.currentContext = null;
		}
	};
};
