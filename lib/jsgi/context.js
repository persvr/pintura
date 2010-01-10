/**
 * Provides the request as the context (across async promises)
 */
var context = require("util/context");
exports.SetContext= function(nextApp){
	return function(request){
		try{
			context.currentContext = request.context = {};
			return nextApp(request);
		}
		finally{
			context.currentContext = null;
		}
	};
};
