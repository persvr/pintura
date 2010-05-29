var fs = require("fs-promise"),
	defer = require("promise").defer,
	Buffer = require('buffer').Buffer,
	mime = require("jack/mime");
exports.Static = function(options){
	var encoding = 'gzip';
	var options = options || {},
		urls = options["urls"] || ["/favicon.ico"],
		roots = options["roots"] || [""],
		compress = options["compress"];
		
	return function(request) {
		var path = request.pathInfo;
		for (var i = 0; i < urls.length; i++) {
			if (path.indexOf(urls[i]) === 0) {
				var rootIndex = 0;
				var responseDeferred = defer();
				if ((request.headers['accept-encoding']||'').indexOf(encoding) < 0)
					compress = undefined;
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
			fs.stat(file)
				.then(function (stat) {
					if(stat.isFile()){
						// file exists.
						fs.open(file, process.O_RDONLY, 0666)
							.then(function (fd) {
								var extension = path.match(/\.[^\.]+$/);
								extension = extension && extension[0];
								var bodyDeferred = defer();
								var write;
							    var response = {
							    	status: 200,
							    	headers: {
							    		"content-length": stat.size,
										"content-type": extension && mime.mimeType(extension)
							    	},
							    	body: {
							    		forEach: function(callback){
							    			write = callback;
											readAndSend(fd);
							    			return bodyDeferred.promise;
							    		},
							    		encoding: "binary"
							    	}
							    };
								if (compress) {
									compress.init();
									delete response.headers["content-length"];
									response.headers["content-encoding"] = encoding;
								}
							    responseDeferred.resolve(response);
								
								function readAndSend (fd) {
									var len = 4096;
									var buffer = new Buffer(len);
									fs.read(fd, buffer, 0, len, null)
										.then(function (bytesRead) {
											if (bytesRead === 0){
												fs.close(fd);
												if (compress)
													write(compress.end());
												bodyDeferred.resolve();
											}
											else {
												if (bytesRead < len) {
													buffer = buffer.slice(0, bytesRead);
												}
												if (compress)
													buffer = compress.deflate(buffer.toString('binary'), 'binary');
												write(buffer);
												readAndSend(fd);
											}
										});
								}							
							}, checkNextRoot);
					}
					else{
						checkNextRoot();
					}
				
			}, checkNextRoot);
		}
	};
};
