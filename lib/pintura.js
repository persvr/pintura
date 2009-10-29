/**
 * This is the top level Pintura module, that delegates functionality to the different components
 * within Pintura, setting up the different middleware to create the full Pintura JSGI app
 * and defining the default mechanisms for security, content negotiation, and persistence.
 */
var registerClass = require("./data").registerClass;
var config = exports.config = {
	mediaSelector: require("./media").Media.optimumMedia,
	database: require("./stores"),
	security: require("./security").DefaultSecurity(),
	facetSelector: require("./facet-resolver").FacetResolver,
	serverName: "Pintura"
};
try{
	org.persvr.javascript.PersevereContextFactory.init();
}catch(e){
	
}

exports.app = JsgiApp(null, config);

function JsgiApp(nextApp, config){
	
	return require("./jsgi/csrf").CSRFDetect(
			//	require("./jsgi/charset").CharacterEncoding(
			require("./jsgi/xsite").CrossSite(
				require("./jsgi/http-params").HttpParams(
					require("./jsgi/pintura-headers").PinturaHeaders(config.serverName,
						//require("./jsgi/session").ClientSession(
						require("./jsgi/auth").Authentication(config.security,
							//require("./jsgi/session").Sequential(
							require("./jsgi/media").MediaConverter(config.mediaSelector,
								require("./jsgi/error").ErrorHandler(
									require("./jsgi/transactional").Transactional(config.database,
										require("./jsgi/facet").FacetAuthorization(config.facetSelector,
											require("./jsgi/rest-store").RestStore(config)
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



