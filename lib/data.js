exports.DefaultStoreConstructor = require("./store/js-file").JSFile;
var registerStore = require("./stores").registerStore;
exports.registerClass = function(name, schema){
	return registerStore(name, new exports.DefaultStoreConstructor(name), schema);
};