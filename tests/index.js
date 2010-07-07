exports.testFullRest = require("./rest");
exports.testJSGIMiddleware = require("./jsgi/index");

if (require.main === module)
    require("patr/runner").run(exports);

