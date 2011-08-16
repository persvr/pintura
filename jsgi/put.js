var when = require("promised-io/promise").when,
	fs = require("promised-io/fs"),
	forEachableToString = require("../media").forEachableToString;

module.exports = function(nextApp) {
    return function(request) {
        if(request.method === "PUT") {
        	return when(forEachableToString(request.body), function(body){
        		fs.writeFile(request.filePath, body);
        		return {
		            status: 200,
		            headers: {},
		            body: ["successful"]
        		}
        	});
        }
        return nextApp ? nextApp(request) : {
        	status: 404,
        	headers: {},
        	body: []
        };
    };
};
