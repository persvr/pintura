/**
 * This will apply the faceting based on the current class context (in the path) for
 * access to the underlying data storage system. The next app will have pathInfo set
 * as just the id in table/id.
 */
var AuthenticateFacet = require("../security").Register;
exports.FacetAuthorization = FacetAuthorization;
function FacetAuthorization(facetSelector, nextApp){
	return function(request){
		request.allowedFacets = request.security.getAllowedFacets(request.remoteUser, request)
					.concat([AuthenticateFacet]);
//function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
		request.store = facetSelector(request);
//dir(request.store);
		return nextApp(request);
		//Set the content type header with the schema
	};
}

function checkForTablePut(request){
	if(!request.scriptName && request.method=="PUT"){
		request.security.hasPermission(request.user, "createStore");
		request.transaction.createEntityStore(parts[0])
	}

}
