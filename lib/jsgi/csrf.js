/**
 * Detects cross-site forgeable requests and warns downstream middleware/apps
 * by adding a crossSiteForgeable property to the request
 */ 
exports.CSRFDetect = function(nextApp, customHeader){
	customHeader = customHeader || "client-id";
	return function(request){
		var headers = request.headers;
		if(!(headers[customHeader] || /application\/j/.test(headers.accept) ||
			(request.method == "POST" && headers.referer && headers.referer.indexOf(headers.host + '/') > 0) ||
			(request.method != "GET" && request.method != "POST"))){
			request.crossSiteForgeable = true;
		}
		return nextApp(request);
	};
};
