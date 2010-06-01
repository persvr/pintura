/**
 * This is the top level Pintura module, that delegates functionality to the different components
 * within Pintura, setting up the different middleware to create the full Pintura JSGI app
 * and defining the default mechanisms for security, content negotiation, and persistence.
 */
var config = exports.config = {
	mediaSelector: require("./media").Media.optimumMedia,
	database: require("perstore/stores"),
	security: require("./security").DefaultSecurity(),
	facetSelector: require("./facet-resolver").FacetResolver,
	serverName: "Pintura"
};

exports.app = JsgiApp(null, config);

function JsgiApp(nextApp, config){
		// This is the set of JSGI middleware and appliance that comprises the Pintura 
		// request handling framework.
			// We detect if the request could have been forged from another site 
		return require("./jsgi/csrf").CSRFDetect(
				// Support handling various cross-site request mechanisms like JSONP, window.name, CS-XHR
				require("./jsgi/xsite").CrossSite(
					// Handle header emulation through query parameters (useful for cross-site and links)
					require("./jsgi/http-params").HttpParams(
						// Handle HEAD requests
						require("jack/head").Head(
							// Add some useful headers
							require("./jsgi/pintura-headers").PinturaHeaders(config.serverName,
								// Handle conditional requests
								require("./jsgi/conditional").Conditional(true,
									// Handle errors that are thrown, converting to appropriate status codes
									require("./jsgi/error").ErrorHandler(
										//	Handle transactions
										require("perstore/jsgi/transactional").Transactional(config.database,
											// Do authentication
											require("./jsgi/auth").Authentication(config.security,
												// Handle conneg, converting from byte representations to JS objects and back again 
												require("./jsgi/media").MediaConverter(config.mediaSelector,
													// Grant REST handlers appropriate facets
													require("./jsgi/faceted").FacetAuthorization(config.facetSelector,
														// Add and retrieve metadata from objects
														exports.directApp = require("./jsgi/metadata").Metadata(
															// Final REST handler
															require("./jsgi/rest-store").RestStore(config)
														)
													)
												)
											)
										)
									)
								)
							)
						)
					)
				)
			);
};
exports.JsgiApp = JsgiApp;

// load the default media types
require("./media/json");
require("./media/javascript");
require("./media/url-encoded");
require("./media/atom");
require("./media/multipart-form-data");
require("./media/html");
require("./media/uri-list");
require("./media/plain");
require("./media/message/json");
