/**
 * Applies basic headers
 */
var when = require("promise").when;
function PinturaHeaders(serverName, nextApp){
	serverName = serverName || "Pintura";
	return function(request){
		return when(nextApp(request), function(response){
			response.headers.server = serverName;
			if(request.remoteUser && request.security){
				response.headers.username = request.security.getUsername(request.remoteUser);
			}
			return response;
		});
	};
}
exports.PinturaHeaders = PinturaHeaders;