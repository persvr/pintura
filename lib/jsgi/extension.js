/*
 * maps /Foo/1.html to /Foo/1 Accept: text/html
 */

exports.mapping = {
	'json': 'application/json',
	'html': 'text/html',
	'xml': 'text/xml'
};

exports.Extension = function(nextApp){
	// patch exports.mapping with registered media types
	// TODO: may be patch Medias to hold 'extension' property?
	var media = require('pintura/media').Media.instances;
	for (var i in media) {
		var ext = media[i].extension;
		if (!ext)
			ext = i.split('/').slice(-1)[0];
		if (ext)
			exports.mapping[ext] = i;
	}
	// handle request
	return function(request){
		// find the last dot-separated token of pathInfo
		var path = request.pathInfo;
		var parts = path.split('.');
		if (parts.length > 1) {
			var extension = parts[parts.length-1];
			// extension found? -> map it to content type
			if (extension) {
				var contentType = exports.mapping[extension];
				// content type found? -> assign it to Accept: header
				// and mangle request.pathInfo
				if (contentType) {
					request.headers.accept = contentType;
					request.pathInfo = path.substring(0, path.length - extension.length - 1);
					// /Foo/1.json --> /Foo/1 Accept: application/json
					// /Foo.json --> /Foo/ Accept: application/json
					if (request.pathInfo.split('/').length < 3) {
						request.pathInfo += '/';
					}
				}
			}
		}
		return nextApp(request);
	};
};
