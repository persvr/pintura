exports.ClientSession = function(nextApp, options){ //onNew, onDestroy){
	var clientSessions = {};
	
	if(typeof setInterval == "function"){
		// if setInterval is available, we will use it to clean out unused sessions
		setInterval(function(){
			var timeout = options.timeout || 60000; // one minute is the default
			for(var i in clientSessions){
				if(new Date().getTime() - clientSessions[i].lastUsed > timeout){
					options.onDestroy(clientSessions[i]);
					delete clientSessions[i];
				} 
			}
		}, 1000);
	}
	return function(env){
		var clientId = env.HTTP_CLIENT_ID;
		env.clientSessions = clientSessions;
		var clientSession = clientSessions[clientId];
		if(!clientSession){
			clientSessions[clientId] = clientSession = {};
			options.onNew(clientSession);
		}
		clientSession.lastUsed = new Date().getTime();
		env.clientSession = clientSession;
		
		return nextApp(env);
	};	
};

exports.Sequential = function(nextApp){
	var assignSync = sync(function(target, func){
		return target._sequenceLock = target._sequenceLock || sync(func);
	});
	return function(env){
		if(env.HTTP_SEQ_ID != null){
			// just sequence anything in the http session
			return (assignSync(env.session, function(env){
				return nextApp(env);
			}))(env);
		}
		var clientSession = env.clientSession;
		
		var nextId = (clientSession.sequence.lastId || 0) + 1;
		if(env.HTTP_SEQ_ID == nextId){
			var response = nextApp(env);
		}
		else{
			var future = clientSession.sequence[nextId] = new Future();
			var response = {
				status:200,
				headers:{},
				body: {
					forEach:function(write){
						return future.promise.then(function(){
							var resp = nextApp(env);
							for(var i in resp){
								response[i] = resp[i];
							}
							return resp.body.forEach(write);
						});
					}
				}
			};
			setTimeout(function(){
				future.fulfill();
			},5000);
			return response;
		}
		for(var i in clientSession.sequence){
			if(i < nextId){
				// execute it out of this thread so this request can finish
				setTimeout(function(){
					clientSession.sequence[i].future.fulfill();
				},0);
				break;
			}
		}
	}
};