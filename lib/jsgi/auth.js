exports.Authentication = function(nextApp){
	return function(env){
		var client;
		var response = nextApp(env);
		response.headers.Username = client.username || ""; 
		return response;
	};	
};
