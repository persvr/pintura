/**
 * Combines JsonP, WindowName, and CrossSiteXhr for full support for all common
 * of cross-site web app access to resources
 */ 

exports.CrossSite = function(nextApp){
	return JsonP(
					WindowName(
						CrossSiteXhr(nextApp)));
	
};

var httpParamRegex = /^http[_-]/;
var convertParams = function(env){
	// must warn other apps that this is a cross-domain request so they can apply 
	// proper security defenses
	env.crossSite = true;
	var parts = env.QUERY_STRING.split("&");
	var i = 0;
	for each(var part in parts){
		var nameValue = parts.split("=");
		if(httpParamRegex.test(nameValue[0])){
			env["HTTP_" + nameValue[0].substring(5).replace(/-/,'_').toUpperCase()] = decodeURIComponent(nameValue[1]);
			// TODO: handle specific ones, in particular the http-content
			parts.splice(i,1);
		}else{
			i++;
		}
	}
	if(parts){
		env.QUERY_STRING = parts.join("&");
	}
};

var JsonP = exports.JsonP = function(nextApp){
	return function(env){
		var callback = getURLParameter("callback") || getURLParameter("jsonp");
		if(callback){
			convertParams(env); 
			var response = nextApp(env);
			response.headers["Content-Type"] = "application/javascript; charset=UTF-8";
			
			var body = response.body;
			// TODO: Add async support
			response.body = {forEach : function(write) {
                write(callback+"(");
                var possiblePromise = body.forEach(write);
                write(")");
            }};
		}
		return response;
	};
};

var WindowName = exports.WindowName = function(nextApp){
	return function(env){
		var windowName = getURLParameter("windowname");
		if(windowName){
			convertParams(env); 
			var response = nextApp(env);
			response.headers["Content-Type"] = "text/html; charset=UTF-8";			
			var body = response.body;
			response.body = {forEach : function(write) {
                write("<html><script type='text/javascript'>var loc = window.name;window.name=\"");
                body.forEach(function(part){
                	var part = JSON.stringify(part);
                	write(part.substring(1, part.length - 1));
                });
                write("\";location=loc;</script></html>");
            }};
		}
		return response;
	};
};

