/**
 * AOP style event handling, for listening for method calls. Very similar to dojo.connect 
 **/

/* Add a listener for the execution of the given function slot on the given object.
 * When object[functionName]() is executed the handler is called.
 * The optional before parameter can be used to indicate if the listener
 * should be fired before or after the  default action (default is after)
 */
exports.addListener = function(object, functionName, listener, before) {
    if (!listener)
        throw new Error("No listener provided");
    var afters, befores,
        main = object[functionName];
    if(typeof main != "function"){
        main = function(){};
    }
	if(main._afters){
        afters = main._afters;
        befores = main._befores;
    }
    else{
        befores = [];
        afters = [];
        var newFunc = object[functionName] = function(){
            for(var i = 0; i < befores.length; i++){
            	try{
                	befores[i].apply(this, arguments);
            	}catch(e){
            		print(e);
            	}
            }
            try{
                return main.apply(this, arguments);
            }
            finally{
                for(var i = 0; i < afters.length; i++){
                	try{
                    	afters[i].apply(this, arguments);
                	}catch(e){
                		print(e);
                	}
                }
            }
        };
        newFunc._befores = befores;
        newFunc._afters = afters;
    }
    if(before){
    	befores.push(listener);	
    }
    else{
    	afters.push(listener);
    }
};