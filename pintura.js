/**
 * This is the top level Pintura module, that delegates functionality to the different components
 * within Pintura, setting up the different middleware to create the full Pintura JSGI app
 * and defining the default mechanisms for security, content negotiation, and persistence.
 */
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

var config = exports.config = {
	mediaSelector: require("./media").Media.optimumMedia,
	database: require("perstore/stores"),
	security: require("./security").DefaultSecurity(),
	responseCache: require("perstore/store/memory").Memory({path: "response"}), //require("perstore/store/filesystem").FileSystem("response", {defaultExtension: "cache",dataFolder: "cache" }),
	serverName: "Pintura",
	customRoutes: [],
	getDataModel: function(request){ 
		return exports.getDataModel(request);
	}
};
exports.getDataModel = function(){ 
	throw new Error("You must assign a getDataModel method to the pintura config object in order to expose data");
};
exports.app = JsgiApp(null, config);

function JsgiApp(nextApp, config){
		// This is the set of JSGI middleware and appliance that comprises the Pintura
		// request handling framework.
		return require("./jsgi/context").SetContext({},
			// We detect if the request could have been forged from another site
			require("./jsgi/csrf").CSRFDetect(
				// Support handling various cross-site request mechanisms like JSONP, window.name, CS-XHR
				require("./jsgi/xsite").CrossSite(
					// Handle header emulation through query parameters (useful for cross-site and links)
					require("./jsgi/http-params").HttpParams(
						// Handle HEAD requests
						require("./jsgi/head").Head(
							// Add some useful headers
							require("./jsgi/pintura-headers").PinturaHeaders(config.serverName,
								// Handle conditional requests
								require("./jsgi/conditional").Conditional(true,
									// Handle response conneg, converting from JS objects to byte representations 
									require("./jsgi/media").Serialize(config.mediaSelector,
										// Handle errors that are thrown, converting to appropriate status codes
										require("./jsgi/error").ErrorHandler(
											//	Handle transactions
											require("perstore/jsgi/transactional").Transactional(
												// Handle sessions
												require("./jsgi/session").Session({},
													// Do authentication
													require("./jsgi/auth").Authentication(config.security,
														// Handle request conneg, converting from byte representations to JS objects
														require("./jsgi/media").Deserialize(config.mediaSelector,
															// Non-REST custom handlers
															require('./jsgi/routes').Routes(config.customRoutes,
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
					)
				)
			)
		);
};
exports.JsgiApp = JsgiApp;
var Connector = require("tunguska/connector").Connector;
exports.addConnection = exports.app.addConnection = function(connection){
	Connector("local-workers", connection);
	connection[connection.on ? "on" : "observe"]("message", function(message){
		message.pathInfo = message.channel || message.to;
		if(message.method && message.method !== "subscribe"){
			exports.directApp(message);
		}
	});
};
