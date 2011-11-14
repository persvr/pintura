require("perstore/util/settings").admins = ["user"];// must do this first
var MockRequest = require("jack/mock").MockRequest, 
	mock = new MockRequest(require("pintura").app),
	assert = require("assert"),
	TestStore = require("perstore/stores").DefaultStore();
	var config = require("pintura").config;
	var parse = require("perstore/util/json-ext").parse;
TestStore.setPath("TestStore");


var emptyApp = function(){
	return {
		headers:{},
		status:200,
		body:[]
	} 
};
var lowerAppMock = new MockRequest(require("../jsgi/context").SetContext({},
			// We detect if the request could have been forged from another site
			require("../jsgi/csrf").CSRFDetect(emptyApp)));
				// Support handling various cross-site request mechanisms like JSONP, window.name, CS-XHR
var lowerApp2Mock = new MockRequest(require("../jsgi/xsite").CrossSite(
					// Handle header emulation through query parameters (useful for cross-site and links)
					require("../jsgi/http-params").HttpParams(emptyApp)));
						// Handle HEAD requests
var lowerApp3Mock = new MockRequest(require("../jsgi/head").Head(
							// Add some useful headers
							require("../jsgi/pintura-headers").PinturaHeaders(config.serverName,
								// Handle conditional requests
								require("../jsgi/conditional").Conditional(true,emptyApp
								))));
var middleAppMock = new MockRequest(require("../jsgi/media").Serialize(config.mediaSelector,
										// Handle errors that are thrown, converting to appropriate status codes
										require("../jsgi/error").ErrorHandler(
											//	Handle transactions
											require("perstore/jsgi/transactional").Transactional(
												// Handle sessions
												require("../jsgi/session").Session({},
													// Do authentication
													require("../jsgi/auth").Authentication(config.security, emptyApp))))));
var upperAppMock = new MockRequest(require("../jsgi/media").Deserialize(config.mediaSelector,
															// Non-REST custom handlers
															require('../jsgi/routes').Routes(config.customRoutes,
																// Add and retrieve metadata from objects
																exports.directApp = require("../jsgi/metadata").Metadata(
																	// Final REST handler
																	require("../jsgi/rest-store").RestStore(config)))));
var emptyMock = new MockRequest(emptyApp);
config.getDataModel = function(){
	return {
		TestStore: TestStore
	};
};
exports.testUpperApp = function(){
	var body = upperAppMock.GET("/TestStore/", {
	}).body;
	assert.equal(body.length, 45);
};
exports.testMiddleAppWithAuth = function(){
	var body = middleAppMock.GET("/TestStore/", {
		headers:{
			authorization: "user:pass"
		}
	}).body;
	assert.equal(body.length, 2);
};
exports.testMiddleApp = function(){
	var body = middleAppMock.GET("/TestStore/", {
	}).body;
	assert.equal(body.length, 2);
};
exports.testLowerApp = function(){
	var body = lowerAppMock.GET("/TestStore/", {
	}).body;
	assert.equal(body.length, 0);
};
exports.testLowerApp2 = function(){
	var body = lowerApp2Mock.GET("/TestStore/", {
	}).body;
	assert.equal(body.length, 0);
};
exports.testLowerApp3 = function(){
	var body = lowerApp3Mock.GET("/TestStore/", {
	}).body;
	assert.equal(body.length, 0);
};
exports.testEmpty = function(){
	var body = emptyMock.GET("/TestStore/", {
		headers:{
			authorization: "user:pass"
		}
	}).body;
	assert.equal(body.length, 0);
};

if (require.main === module)
    require("patr/runner").run(exports);

