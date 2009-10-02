/**
* HTTP Client using the JSGI standard objects
*/
var Promise = require("promise").Promise;

exports.request = function(env){
	var xhr = new XMLHttpRequest();
	xhr.open(env.method, env.url || // allow env.uri to shortcut creating a URL from all the various parts 
		(env.scheme + "://" + env.serverName + ":" + env.serverPort + env.pathInfo + (env.queryString ? '?' + env.queryString : '')), true);
	for(var i in env.headers){
		xhr.setRequestHeader(i, env.headers[i]);
	}
	var promise = new Promise();
	var response;
	var lastUpdate;
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4 || xhr.readyState == 3){
			if(!response){
				response = {
					body: [xhr.responseText],
					status: xhr.status,
					headers: {}
				};
				lastUpdate = xhr.responseText.length;
				var headers = xhr.getAllResponseHeaders();
				headers = headers.split(/\n/);
				for(var i = 0; i < headers.length; i++){
					var name = headers.split(": ", 2)[0];
					response.headers[name.toLowerCase()] = xhr.getResponseHeader(name);
				}
			}
			else{
				response.body = [xhr.responseText.substring(lastUpdate)];
				lastUpdate = xhr.responseText.length;
			}
			if(xhr.readyState == 4){
				promise.fulfill(response);
			}
			else{
				promise.progress(response);
			}
		}
	}
	xhr.send(env.body);
	return promise;
}

