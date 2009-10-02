/**
 * Combines JsonP, WindowName, and CrossSiteXhr for full support for all common
 * of cross-site web app access to resources
 */ 
var parseQuery = require("jack/utils").parseQuery;
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
	var parts = env.queryString.split("&");
	var i = 0;
	for each(var part in parts){
		var nameValue = parts.split("=");
		if(httpParamRegex.test(nameValue[0])){
			env.headers[nameValue[0].substring(5).toLowerCase()] = decodeURIComponent(nameValue[1]);
			// TODO: handle specific ones, in particular the http-content
			parts.splice(i,1);
		}else{
			i++;
		}
	}
	if(parts){
		env.queryString = parts.join("&");
	}
};

function JsonP(nextApp){
	return function(env){
		var params = env.params || (env.params = parseQuery(env.queryString));
		var callback = params.callback || params.jsonp;
		if(callback){
			convertParams(env); 
			var response = nextApp(env);
			response.headers["content-type"] = "application/javascript; charset=UTF-8";
			
			var body = response.body;
			// TODO: Add async support
			response.body = {forEach : function(write) {
                write(callback+"(");
                var possiblePromise = body.forEach(write);
                write(")");
            }};
            return response;
		}
		return nextApp(env);
		
	};
};
exports.JsonP = JsonP;

function WindowName(nextApp){
	return function(env){
		var params = env.params || (env.params = parseQuery(env.queryString));
		
		var windowName = params.windowname;
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
            return response;
		}
		return nextApp(env);
	};
};
exports.WindowName = WindowName;

function CrossSiteXhr(nextApp){
	return function(env, allowed){
		if(env.headers.origin){
			convertParams(env);
			var response = nextApp(env);
			var headers = response.headers = response.headers || {}; 
			// the hideousneous that is IE strikes again, they strip content type parameters
			//	off of the content type for cross domain requests!
			if(contentType){ 
				headers["content-type"] = (headers["content-type"] || "").replace(/;/,",");
			} 
			headers["access-control-allow-origin"] = "*";
			headers.Vary = ((headers.Vary && ",") || "") + "origin";
			return response;
		}
		
		return nextApp(env);
		
	};
};

exports.CrossSiteXhr = CrossSiteXhr;