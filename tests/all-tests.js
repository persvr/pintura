exports.testFullRest = require("./rest");
exports.testJSGIMiddleware = require("./jsgi/all-tests");

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));

