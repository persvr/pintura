/**
 * Allows the placement of HTTP headers and method in query parameters. This
 * is very useful for situations where it is impossible for the requesting code to set
 * headers (such as setting cross-site script tag/JSONP, form posts, and 
 * setting window.location to download data).
 */ 
var httpParamRegex = /^http[_-]/;
exports.HttpParams = function(nextApp){
	return function(request){
		var parts = request.queryString.split("&");
		
		for(var i = 0; i < parts.length;){
			var nameValue = parts[i].split("=");
			if(httpParamRegex.test(nameValue[0])){
				request.headers[nameValue[0].substring(5).toLowerCase()] = decodeURIComponent(nameValue[1]);
				// TODO: handle specific ones, in particular the http-content
				parts.splice(i,1);
			}else{
				i++;
			}
		}
		if(parts){
			request.queryString = parts.join("&");
		}
		return nextApp(request);
	};
};
