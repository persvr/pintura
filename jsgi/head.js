var when = require("promised-io/promise").when;

var Head = function(nextApp) {
    return function(request) {
        if(request.method === "HEAD") {
            request.method = "GET"; // HEAD must act the same as GET
            return when(nextApp(request), function(response) {
                response.body = [];
                return response;
            });
        }
        return nextApp(request);
    };
};
Head.Head = Head;
module.exports = Head;