var AccessError = require("perstore/errors").AccessError;

exports = module.exports = function(security, nextApp){
	return function(request){
		var user = request.remoteUser || null;
		// define the dataModel for the request
		request.dataModel = security.getModelForUser(user);
		return nextApp(request);
	};
};
