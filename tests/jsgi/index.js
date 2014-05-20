exports.testCSRF = require("./csrf");
exports.testConfigure = require("./csrf");

if (require.main === module)
    require("patr/runner").run(exports);

