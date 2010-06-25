var CSRFDetect = require("jsgi/csrf").CSRFDetect, 
	assert = require("assert"),
	print = require("commonjs-utils/system").print;
	

exports.testCSRF = function(){
	CSRFDetect(function(request){
		assert.equal(request.crossSiteForgeable, true);
	})({method:"POST", headers:{}});
};

if(require.main === module){
	for(var i in exports){
		if(i.substring(0,4) == "test"){
			print("testing " + i);
			exports[i]();
		}
	}
}