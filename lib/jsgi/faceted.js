/**
 * This will apply the faceting based on the current class context (in the path) for 
 * access to the underlying data storage system. The next app will have pathInfo set
 * as just the id in table/id.
 */
var AuthenticateFacet = require("../security").Authenticate;
exports.FacetAuthorization = FacetAuthorization;
function FacetAuthorization(facetSelector, nextApp){
	return function(request){
		request.allowedFacets = request.security.getAllowedFacets(request.remoteUser, request)
					.concat([AuthenticateFacet]);
		request.store = request.facetedTransaction = facetSelector(request);
		return nextApp(request);
		//Set the content type header with the schema
	};
}

function checkForTablePut(env){
	if(!env.scriptName && env.method=="PUT"){
		env.security.hasPermission(env.user, "createStore");
		env.transaction.createEntityStore(parts[0])
	}
	
}
