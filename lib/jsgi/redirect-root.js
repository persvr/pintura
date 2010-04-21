exports.RedirectRoot = function(nextApp, location){
    var redirector = require("jack/redirect").Redirect(location);
    return function(request) {
        if(request.pathInfo == "/") {
            return redirector(request);
        }
        return nextApp(request);
    };
};
