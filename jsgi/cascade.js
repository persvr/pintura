/**
 * Cascade tries an request on several apps, and returns the first response 
 * that is not 404.
 */
var defer = require("promised-io/promise").defer,
	when = require("promised-io/promise").when;
var Cascade = function(apps, status) {
    status = status || 404;

    return function(env) {
        var i = 0;
        var deferred = defer(),
        	lastResponse;
        function next(){
        	if(i < apps.length){
        		try{
	        		when(apps[i](env), function(response){
		        		i++;
			            if (response.status !== status) {
			                deferred.resolve(response);
			            }else{
			            	lastResponse = response;
			            	next();
			            }
	        		}, deferred.reject);
        		}catch(e){
        			deferred.reject(e);
        		}
        	}else{
        		deferred.resolve(lastResponse);
        	}
        }
        next();
        return deferred.promise;
    }
}
Cascade.Cascade = Cascade;
module.exports = Cascade;