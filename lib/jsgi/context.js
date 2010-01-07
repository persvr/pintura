/**
 * Provides the request as the context (across async promises)
 */
var promise = require("promise");
exports.Context= function(nextApp){
	return function(request){
		try{
			promise.context = request;
			return nextApp(request);
		}
		finally{
			delete promise.context;
		}
	};
};
