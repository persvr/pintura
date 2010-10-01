var fs = require("promised-io/fs"),
	defer = require("promised-io/promise").defer,
	mime = require("jack/mime");
exports.Static = function(options, nextApp){
	var options = options || {},
		urls = options.urls || ["/favicon.ico"],
		root = options.root || (options.roots && options.roots[0]) || "",
		index = options.index || "index.html", 
		directoryListing = options.directoryListing;
		
	return function(request) {
		var path = request.pathInfo;
		if(path.indexOf("..") > -1){
			return {
				status: 403,
				headers: {},
				body: ["Parent directory references are not allowed"]
			}
		}
		for (var i = 0; i < urls.length; i++) {
			if (path.indexOf(urls[i]) === 0) {
				var relative = path.slice(urls[i].length);
				var rootIndex = 0;
				var responseDeferred = defer();
				tryFile(root + relative, function(){
					responseDeferred.resolve(nextApp ? nextApp(request) :
						{
							status: 404,
							headers: {},
							body: [path + " not found"]
						});
				});
				return responseDeferred.promise;
			}
		}
		return nextApp ? nextApp(request) : {
			status: 404,
			headers: {},
			body: [path + " not found"]
		};
		function tryFile(filePath, onFail){
			fs.stat(filePath)
				.then(function (stat) {
					if(stat.isFile()){
						// file exists.
						fs.open(filePath, "r", 0666)
							.then(function (file) {
								var extension = filePath.match(/\.[^\.]+$/);
								extension = extension && extension[0];
								var bodyDeferred = defer();
								var write;
								file.encoding = "binary";
							    responseDeferred.resolve({
							    	status: 200,
							    	headers: {
							    		"content-length": stat.size,
										"content-type": extension && mime.mimeType(extension)
							    	},
							    	body: file
							    });
							}, onFail);
					}
					else if(stat.isDirectory()){
						tryFile(filePath + "/" + index, directoryListing ? function(){
							if(filePath.charAt(filePath.length - 1) == "/"){
								fs.readdir(filePath).then(function(paths){
								    responseDeferred.resolve({
								    	status: 200,
								    	headers: {
											"content-type": "text/html"
								    	},
								    	body: {
								    		forEach: function(write){
								    			write(DIR_START);
								    			paths.sort();
								    			paths.forEach(function(path){
								    				write(DIR_FILE.replace(/%s/g, path));
								    			});
								    			write(DIR_END);
								    		}
								    	}
								    });
								});
							}else{
							    responseDeferred.resolve({
							    	status: 301,
							    	headers: {
										location: request.scriptName + request.pathInfo + '/'
							    	},
							    	body: []
							    });
							}
						} : onFail);
					}
					else{
						onFail();
					}

			}, onFail);
		}
	};
};
var DIR_FILE =
'<tr>\n\
    <td class="name"><a href="%s">%s</a></td>\n\
</tr>';

var DIR_START =
'<html><head>\n\
<meta http-equiv="content-type" content="text/html; charset=utf-8" />\n\
<style type="text/css">\n\
    table { width:100%%; }\n\
    .name { text-align:left; }\n\
    .size, .mtime { text-align:right; }\n\
    .type { width:11em; }\n\
    .mtime { width:15em; }\n\
</style>\n\
</head><body>\n\
<hr />\n\
<table>\n\
<tr>\n\
    <th class="name">Name</th>\n\
</tr>\n';
var DIR_END = '\n\
</table>\n\
<hr />\n\
</body>\n</html>';
