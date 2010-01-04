var CSRFDetect = require("jsgi/csrf").CSRFDetect, 
	assert = require("assert");

exports.testCSRF = function(){
	CSRFDetect(function(request){
		assert.equal(request.crossSiteForgeable, true);
	})({method:"POST", headers:{}});
};