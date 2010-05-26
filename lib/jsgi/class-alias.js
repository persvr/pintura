var classModel = require('model').classModel;

exports.Handler = function(nextApp) {
    return function(request) {
        try {
            var modelPath = request.pathInfo.substring(1);
            var model = classModel.get(modelPath);
            request.pathInfo = "/Class/" + encodeURIComponent(modelPath);
        } catch (e) {}
        return nextApp(request);
    };
};
