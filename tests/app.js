var Model = require("model").Model;
exports.testStore = require("stores").DefaultStore("TestStore");
exports.testModel = Model("TestStore", exports.testStore,{});


