/**
 * Cascade tries an request on several apps, and returns the first response 
 * that is not 404.
 */
var defer = require("events").defer,
	when = require("events").when;
var Cascade = exports.Cascade = function(apps, status) {
    status = status || 404;

    return function(env) {
        var i = 0;
        var deferred = defer();   
        function next(){
        	if(i < apps.length){
        		when(apps[i](env), function(response){
	        		i++;
		            if (response.status !== status) {
		                deferred.resolve(response);
		            }else{
		            	next();
		            }
        		}, deferred.reject);
        	}else{
        		deferred.resolve({
        			status: 404,
        			headers: {},
        			body: [env.pathInfo + " not found"]
        		});
        	}
        }
        next();
        return deferred.promise;
    }
}
