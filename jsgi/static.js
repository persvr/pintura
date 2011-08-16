var fs = require("promised-io/fs"),
	defer = require("promised-io/promise").defer,
	mime = require("./mime");
exports.Static = function(options, nextApp){
	var options = options || {},
		urls = options.urls || ["/favicon.ico"],
		root = options.root || (options.roots && options.roots[0]) || "",
		index = options.index || "index.html",
		cachePolicy = options.cachePolicy || {},
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
					var ifModHeader=request['headers']['if-modified-since'];
					if(stat.isFile()){
						if(request.method == "GET"){
							// file exists.
							var extension = filePath.match(/\.[^\.]+$/);
							extension = extension && extension[0];
							var mimeType = extension && mime.mimeType(extension);
							var modifiedTime=new Date(stat.mtime);
							if(ifModHeader && new Date(ifModHeader)>=modifiedTime){
								// If it hasn't changed, do no further work.
								var headers = {"Date": new Date().toUTCString()};
								if(mimeType in cachePolicy || "*" in cachePolicy){
									headers['Expires']=new Date(new Date().valueOf()+
										(mimeType in cachePolicy ? cachePolicy[mimeType] : cachePolicy["*"]) *1000).toUTCString();
								}
								responseDeferred.resolve({
									status: 304,
									headers: headers,
									body: []
								});
							} else {
								// File has changed since last served to this client.
								fs.open(filePath, "r", 0666)
									.then(function (file) {
										var headers = {"content-length": stat.size,
											"Vary":"Accept-Encoding",
											"Date": new Date().toUTCString(),
											"Last-Modified": modifiedTime.toUTCString()};
										if(mimeType in cachePolicy || "*" in cachePolicy){
											headers['Expires']=new Date(new Date().valueOf()+
												(mimeType in cachePolicy ? cachePolicy[mimeType] : cachePolicy["*"]) *1000).toUTCString();
										}
										if(mimeType && (mimeType.substr(0,4)=='text' ||
										   mimeType.indexOf('xml')>=0 ||
										   mimeType.indexOf('json')>=0)) {
											mimeType+='; charset=UTF-8';
										}
										headers['content-type']=mimeType;
										stat = fs.statSync(filePath); // re-retrieve it
										var bodyDeferred = defer();
										var write;
										file.encoding = "binary";
										responseDeferred.resolve({
											status: 200,
											headers: headers,
											body: file
										});
									}, onFail);
							}
						}else{
							request.filePath = filePath;
							onFail();
						}
					}
					else if(stat.isDirectory()){
						var modifiedTime=new Date(stat.mtime);
						if(ifModHeader && new Date(ifModHeader)>=modifiedTime){
							// If it hasn't changed, do no further work.
							responseDeferred.resolve({
								status: 304,
								headers: {"Date": new Date().toUTCString()},
								body: []
							});
						} else {
							tryFile(filePath + "/" + index, directoryListing ? function(){
								if(filePath.charAt(filePath.length - 1) == "/"){
									fs.readdir(filePath).then(function(paths){
										responseDeferred.resolve({
											status: 200,
											headers: {
												"content-type": "text/html; charset=UTF-8",
												"Last-Modified": new Date(stat.mtime).toUTCString()
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
