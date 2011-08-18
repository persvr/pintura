var CSRFDetect = require("../../jsgi/csrf").CSRFDetect, 
	assert = require("assert"),
	print = require("promised-io/process").print;
	

exports.testCSRF = function(){
	CSRFDetect(function(request){
		assert.equal(request.crossSiteForgeable, true);
	})({method:"POST", headers:{}});
};

if (require.main === module)
    require("patr/runner").run(exports);