require("perstore/util/settings").admins = ["user"];// must do this first
var MockRequest = require("jack/mock").MockRequest, 
	mock = new MockRequest(require("pintura").app),
	assert = require("assert"),
	TestStore = require("perstore/stores").DefaultStore();
	parse = require("perstore/util/json-ext").parse;
TestStore.setPath("TestStore");
require("pintura").config.getDataModel = function(){
	return {
		TestStore: TestStore
	};
};
exports.testGet = function(){
	var body = mock.GET("/TestStore/", {
		headers:{
			authorization: "user:pass"
		}
	}).body;
	assert.equal(parse(body).length, 3);
};

if (require.main === module)
    require("patr/runner").run(exports);

