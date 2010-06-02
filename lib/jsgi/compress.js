/**
 * JSGI app that GZIPs the response
 */
var when = require("promise").when;

exports.Compress = function(nextApp){
	return function(request){
		var encoding = 'gzip';
		if ((request.headers['accept-encoding']||'').indexOf(encoding) >= 0) {
			// so far only node.js provides compression module
			var Gzip = require('compress').Gzip;
			if (Gzip) {
				return require('promise').when(nextApp(request), function(response){
					// skip if already encoded
					if (response.headers['content-encoding'] || response.status == 204) return response;
					// substitute the body
					var data = response.body;
					response.body = {
						encoding: 'binary',
						forEach: function(write){
							var zipper = new Gzip;
							zipper.init();
							return when(data.forEach(function(chunk){
								if(chunk.byteLength){
									chunk = chunk.toString("binary");
								}
								write(zipper.deflate(chunk, 'binary'));
							}), function(){
								write(zipper.end());
							});
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
