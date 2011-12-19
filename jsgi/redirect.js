var uri = require("../util/url");

var Redirect = function (path, status) {
    
    status = status || 301;
    
    return function (request) {
        var location =
            (request.scheme || "http") +
            "://" +
            (request.headers.host || (
                request.host +
                (request.port == 80 ? "" : ":" + request.port)
            )) +
            (request.scriptName || "") +
            request.pathInfo;
        
        location = path ? uri.resolve(location, path) : request.headers.referer;
        
        return {
            status: status,
            headers: {
                "location": location,
                "content-type": "text/plain"
            },
            body: ['Go to <a href="' + location + '">' + location + "</a>"]
        }
    }
}
Redirect.Redirect = Redirect;
module.exports = Redirect;