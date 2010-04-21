require("settings").admins = ["user"];// must do this first
var MockRequest = require("jack/mock").MockRequest, 
	mock = new MockRequest(require("pintura").app),
	assert = require("assert"),
	parse = require("commonjs-utils/json-ext").parse;
require("./app");

exports.testGet = function(){
	var body = mock.GET("/TestStore/", {
		headers:{
			authorization: "user:pass"
		}
	}).body;
	assert.equal(parse(body).length, 3);
};

exports.testPerformance = function(){
	var startTime = new Date().getTime();
	for(var i = 0;i < 1000;i++){
		mock.GET("/Class/TestStore", {
			headers:{
				authorization: "user:pass"
			}
		});
	}
	print("Performed " + 1000000 / (new Date().getTime() - startTime) + " requests per second");
}
if (require.main == module)
    require("os").exit(require("test/runner").run(exports));

