var classModel = require('model').classModel;

exports.Handler = function(nextApp) {
    return function(request) {
        if (request.method === "GET") {
            try {
                var modelPath = request.pathInfo.substring(1);
                if (classModel.get(modelPath))
                    request.pathInfo = "/Class/" + encodeURIComponent(modelPath);
            } catch (e) {}
        }
        return nextApp(request);
    };
};
