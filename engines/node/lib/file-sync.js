// this provides sync versions of the posix functions, to fulfill a Narwhal-ish interface.
// It is generally recommended that you stick with the async posix functions, but these
// are useful for reading config stuff and already-fast or non-performance sensitive operations.
var posix = require("posix");
for(var i in posix){
	(function(async){
		exports[i] = function(){
			return async.apply(posix, arguments).wait();
		}
	})(posix[i]);
}
exports.read = function(path){
	return posix.cat(path, "utf8").wait();
};
exports.write= function(path, data){
    posix.open(path, process.O_CREAT, 0777).addCallback(function(fd){
	   return posix.write(fd, data, 0, "utf8");
	}).wait();
};