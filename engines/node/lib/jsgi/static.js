var posix = require("posix"),
	defer = require("events").defer,
	mime = require("jack/mime");
exports.Static = function(options){		
	var options = options || {},
		urls = options["urls"] || ["/favicon.ico"],
		root = options["root"] || "",
		fileServer = File(root);
		
	return function(request) {
		var path = request.pathInfo;
		for (var i = 0; i < urls.length; i++)
			if (path.indexOf(urls[i]) === 0) {
		var responseDeferred = defer(); 
		var file = root + path;
		posix.stat(file)
			.addCallback(function (stat) {
				// file exists.
				posix.open(file, process.O_RDONLY, 0666)
					.addErrback(return404)
					.addCallback(function (fd) {
						var extension = path.match(/\.([\.]+)$/);
						extension = extension && extension[1];
						var bodyDeferred = defer();
						var write;
					    responseDeferred.resolve({
					    	status: 200,
					    	headers: {
					    		"content-length": stat.size,
								"content-type": mime.mimeType(extension, "text/plain")
					    	},
					    	body: {
					    		forEach: function(callback){
					    			write = callback;
					    			return bodyDeferred.promise;
					    		}
					    	}
					    });
						readAndSend(fd);
						function readAndSend (fd) {
							posix.read(fd, 1024, null, "binary")
								.addCallback(function (data, bytesRead) {
									if (bytesRead === 0){
										bodyDeferred.resolve();
									}
									else {
										write(data, "binary");
										readAndSend(fd);
									}
								});
						}
					});
			})
			.addErrback(return404);
		function return404(){
			responseDeferred.resolve({
				status: 404,
				headers: {},
				body: [path + " not found"]
			});
		}
		return responseDeferred.promise;
	};
};