/**
 * Applies basic headers
 */
function PinturaHeaders(serverName, nextApp){
	serverName = serverName || "Pintura";
	return function(request){
		var response = nextApp(request);

		response.headers.server = serverName;
		if(request.remoteUser && request.security){
			response.headers.username = request.security.getUsername(request.remoteUser);
		}
		return response;
	};
}
exports.PinturaHeaders = PinturaHeaders;