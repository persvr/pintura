/**
 * JSGI app that GZIPs the response
 */
var when = require("promised-io/promise").when;

var Compress = function(nextApp){
	return function(request){
		var encoding = 'gzip';
		if ((request.headers['accept-encoding']||'').indexOf(encoding) >= 0) {
			// so far only node.js provides compression module
			var Gzip = require('compress').Gzip;
			if (Gzip) {
				return when(nextApp(request), function(response){
					var contentType = response.headers["content-type"];
					contentType = contentType && contentType.split("/")[0];
					if (response.headers['content-encoding'] || // skip if already encoded
							response.status == 204 || // of if no body
							!(contentType == "application" || contentType == "text")) // or if not an acceptable type
						return response;
					// substitute the body
					var data = response.body;
					response.body = {
						encoding: 'binary',
						forEach: function(write){
							var zipper = new Gzip;
							zipper.init();
							try{
								return when(data.forEach(function(chunk){
									if(chunk.byteLength){
										chunk = chunk.toString("binary");
									}
									write(zipper.deflate(chunk, 'binary'));
								}), end, function(e){
									write(zipper.deflate(e.message, 'binary'));
									end();
								});
							}catch(e){
								write(zipper.deflate(e.message, 'binary'));
								end();
							}
							function end(){
								write(zipper.end());
							}
						}
					};
					// mark content as encoded
					response.headers['content-encoding'] = encoding;
					delete response.headers['content-length'];
					return response;
				});
			}
		}
		return nextApp(request);
	};
};
Compress.Compress = Compress;
module.exports = Compress;