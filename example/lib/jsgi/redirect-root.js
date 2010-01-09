var redirector = require("jack/redirect").Redirect("/Page/Example");
exports.RedirectRoot = function(app){
	return function(request){
		if(request.pathInfo == "/"){
			return redirector(request);
		}
		return app(request);
	};
};