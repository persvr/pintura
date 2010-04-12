// this module name is uri in jack for narwhal, here we fork just to match node's url module
var uri = require("url");

exports.Redirect = function (path, status) {
    
    status = status || 301;
    
    return function (env) {
        var location = 
            (env.scheme || "http") +
            "://" + 
            (env.headers.host || (
                env.serverName +
                (env.serverPort == "80" ? "" : ":" + env.serverPort)
            )) +
            (env.scriptName || "") +
            env.pathInfo;

        location = path ? uri.resolve(location, path) : env.headers.referer;

        return {
            status : status,
            headers : {
                "Location": location,
                "Content-type": "text/plain"
            },
            body : ['Go to <a href="' + location + '">' + location + "</a>"]
        };
    };
};

