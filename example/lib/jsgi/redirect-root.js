var redirector = require("jack/redirect").Redirect("/Page/Root");
exports.RedirectRoot = function(app){
	return function(request){
		if(request.pathInfo == "/"){
			return redirector(request);
		}
		return app(request);
	};
};