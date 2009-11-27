/**
 * JSGI Middleware that rewrites paths
 */
exports.Rewriter= function(matchPath, replacementPath, nextApp){
	return function(request){
		if(request.pathInfo.match(matchPath)){
			request.pathInfo = request.pathInfo.replace(matchPath, replacementPath);
		}
		return nextApp(request);
	};
}
