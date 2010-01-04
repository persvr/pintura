require("settings").admins = ["user"];// must do this first
var MockRequest = require("jack/mock").MockRequest, 
	mock = new MockRequest(require("pintura").app),
	assert = require("assert"),
	parse = require("json-ext").parse;
require("./app");

exports.testGet = function(){
	var body = mock.GET("/TestStore/", {
		headers:{
			authorization: "user:pass"
		}
	}).body;
	assert.equal(parse(body).length, 3);
};

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));

