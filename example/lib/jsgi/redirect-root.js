var redirector = require("jack/redirect").Redirect("/Page/Root");
exports.redirectRoot = function(request){
	if(request.pathInfo == "/"){
		return redirector(request);
	}
	return {status:404, headers:{}, body:[]};
};