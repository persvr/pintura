/**
 * Applies basic headers
 */
var when = require("promised-io/promise").when;

function PinturaHeaders(serverName, nextApp){
	serverName = serverName || "Pintura";
	return function(request){
		request.xhr = request.headers['x-requested-with'] === 'XMLHttpRequest';
		return when(nextApp(request), function(response){
			response.headers.server = serverName;
			if(request.remoteUser){
				response.headers.username = request.remoteUser;
			}
			return response;
		});
	};
}
PinturaHeaders.PinturaHeaders = PinturaHeaders;
module.exports = PinturaHeaders;