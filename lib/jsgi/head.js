var Head = exports.Head = function(app) {
    return function(request) {
        if (request.method === "HEAD")
            request.method = "GET"; // HEAD must act the same as GET
        
        var response = app(request);

        if (request.method === "HEAD")
            response.body = [];
            
        return response;
    }
}
