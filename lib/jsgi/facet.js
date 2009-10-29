/**
 * This will apply the faceting based on the current class context (in the path) for 
 * access to the underlying data storage system. The next app will have pathInfo set
 * as just the id in table/id.
 */
exports.FacetAuthorization = FacetAuthorization;
function FacetAuthorization(facetSelector, nextApp){
	return function(request){
		var parts = request.pathInfo.split("/");
		request.allowedFacets = request.security.getAllowedFacets(request.authenticatedUser, request);
		request.store = request.facetedTransaction = facetSelector(request);
		for(var i = 1; i < parts.length - 1; i++){
			// allow for nested stores by incrementally traversing into stores 
			request.scriptName += '/' + parts[i];
			request.store = request.store.getEntityStore(parts[i]);
		}
		request.pathInfo = '/' + parts[i];
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
