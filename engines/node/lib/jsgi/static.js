var posix = require("posix"),
	defer = require("events").defer,
	mime = require("jack/mime");
exports.Static = function(options){		
	var options = options || {},
		urls = options["urls"] || ["/favicon.ico"],
		roots = options["roots"] || [""];
		
	return function(request) {
		var path = request.pathInfo;
		for (var i = 0; i < urls.length; i++) {
			if (path.indexOf(urls[i]) === 0) {
				var rootIndex = 0;
				var responseDeferred = defer();
				checkNextRoot();
				return responseDeferred.promise;
			}
		}
		return {
			status: 404,
			headers: {},
			body: [path + " not found"]
		};
		function checkNextRoot(){ 
			if(rootIndex >= roots.length){
				responseDeferred.resolve({
					status: 404,
					headers: {},
					body: [path + " not found"]
				});
				return;
			}
			var file = roots[rootIndex] + path;
			rootIndex++;
			posix.stat(file)
				.addCallback(function (stat) {
					if(stat.isFile()){
						// file exists.
						posix.open(file, process.O_RDONLY, 0666)
							.addErrback(checkNextRoot)
							.addCallback(function (fd) {
								var extension = path.match(/\.([\.]+)$/);
								extension = extension && extension[1];
								var bodyDeferred = defer();
								var write;
							    responseDeferred.resolve({
							    	status: 200,
							    	headers: {
							    		"content-length": stat.size,
										"content-type": extension && mime.mimeType(extension, "text/plain")
							    	},
							    	body: {
							    		forEach: function(callback){
							    			write = callback;
							    			return bodyDeferred.promise;
							    		}
							    	}
							    });
							    var bufferedData = "";
								readAndSend(fd);
								function readAndSend (fd) {
									posix.read(fd, 1024, null, "binary")
										.addCallback(function (data, bytesRead) {
											if (bytesRead === 0){
												bodyDeferred.resolve();
											}
											else {
												if(write){
													if(bufferedData){
														write(bufferedData, "binary");
														bufferedData = null;
													}
													write(data, "binary");
												}
												else{
													// forEach hasn't been called yet, buffer data in the meantime
													bufferedData += data;
												}
												readAndSend(fd);
											}
										});
								}
							});
					}
					else{
						checkNextRoot();
					}
				
			})
			.addErrback(checkNextRoot);
		}
	};
};