exports.testCSRF = require("./csrf");

if (require.main === module)
    require("patr/runner").run(exports);

