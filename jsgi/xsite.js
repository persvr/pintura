/**
 * Combines JsonP, WindowName, and CrossSiteXhr for full support for all common
 * of cross-site web app access to resources
 */ 
var parseQuery = require("./querystring").parseQuery,
	when = require("promised-io/promise").when;
	
var CrossSite = function(nextApp){
	return JsonP(
		WindowName(
			CrossSiteXhr(nextApp)));
};
CrossSite.CrossSite = CrossSite;

function JsonP(nextApp){
	return function(request){
		var params = request.params || (request.params = parseQuery(request.queryString, /[&\?]/));
		var callback = params.callback || params.jsonp;
		if(callback){
			request.queryString = request.queryString.replace(params.callback ? /callback=[^&]+/ : /jsonp=[^&]+/,'');
			request.crossSite = true;
			request.headers.accept = "application/javascript"; // if it is JSONP, the response must be javascript
			return when(nextApp(request), function(response){
				response.headers["content-type"] = "application/javascript; charset=UTF-8";
				
				var body = response.body;
				response.body = {forEach : function(write) {
					write(callback+"(");
					body.forEach(write);
					write(")");
				}};
				return response;
			});
		}
		return nextApp(request);
		// TODO: Handle 401 with a dialog to enter credentials 
	};
};
CrossSite.JsonP = JsonP;

function WindowName(nextApp){
	return function(request){
		var params = request.params || (request.params = parseQuery(request.queryString));
		
		var windowName = params.windowname;
		if(windowName){
			request.crossSite = true;
			return when(nextApp(request), function(response){
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
			});
		}
		return nextApp(request);
	};
};
CrossSite.WindowName = WindowName;

function CrossSiteXhr(nextApp){
	return function(request, allowed){
		if(request.headers.origin){
			// TODO: Chrome always includes origin header, should only do this if it is truly cross-site
			request.crossSite = true;
			// TODO: turn this on once we have true cross-site figured out
			//request.crossSiteForgeable = true;
			return when(nextApp(request), function(response){
				var headers = response.headers = response.headers || {}; 
				// the hideousneous that is IE strikes again, they strip content type parameters
				//	off of the content type for cross domain requests!
				if(/trident/.test(request.headers["user-agent"])){ 
					headers["content-type"] = (headers["content-type"] || "").replace(/;/,",");
				} 
				headers["access-control-allow-origin"] = "*";
				if(request.method === "OPTIONS"){
					if(request.headers["access-control-request-method"]){
						headers["access-control-allow-methods"] = request.headers["access-control-request-method"];
					}
					if(request.headers["access-control-request-headers"]){
						headers["access-control-allow-headers"] = request.headers["access-control-request-headers"];
					}
					headers["access-control-allow-credentials"] = true;
				}
				
				headers.vary = ((headers.vary && ",") || "") + "origin";
				return response;
			});
		}
		
		return nextApp(request);
		
	};
};

CrossSite.CrossSiteXhr = CrossSiteXhr;
module.exports = CrossSite;