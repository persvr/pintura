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


function JsonP(nextApp){
	return function(env){
		var params = env.params || (env.params = parseQuery(env.queryString));
		var callback = params.callback || params.jsonp;
		if(callback){
			env.crossSite = true;
			var response = nextApp(env);
			response.headers["content-type"] = "application/javascript; charset=UTF-8";
			
			var body = response.body;
			// TODO: Add async support
			response.body = {forEach : function(write) {
                write(callback+"(");
                body.forEach(write);
                write(")");
            }};
            return response;
		}
		return nextApp(env);
		// TODO: Handle 401 with a dialog to enter credentials 
	};
};
exports.JsonP = JsonP;

function WindowName(nextApp){
	return function(env){
		var params = env.params || (env.params = parseQuery(env.queryString));
		
		var windowName = params.windowname;
		if(windowName){
			env.crossSite = true;
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
			env.crossSite = true;
			var response = nextApp(env);
			var headers = response.headers = response.headers || {}; 
			// the hideousneous that is IE strikes again, they strip content type parameters
			//	off of the content type for cross domain requests!
			if(contentType){ 
				headers["content-type"] = (headers["content-type"] || "").replace(/;/,",");
			} 
			headers["access-control-allow-origin"] = "*";
			headers.vary = ((headers.Vary && ",") || "") + "origin";
			return response;
		}
		
		return nextApp(env);
		
	};
};

exports.CrossSiteXhr = CrossSiteXhr;