/**
 * Applies basic headers
 */
function PinturaHeaders(serverName, nextApp){
	serverName = serverName || "Pintura";
	return function(env){
		var response = nextApp(env);

		response.headers.server = serverName;
		//response.headers.date = new Date().toGMTString();
		return response;
	};
}
exports.PinturaHeaders = PinturaHeaders;