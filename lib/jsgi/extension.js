/*
 * maps /Foo/1.html to /Foo/1 Accept: text/html
 */

exports.Extension = function(mapping, nextApp){
	var types = {};
	// collect registered media types
	// then patch them using user-specified mapping
	// TODO: may be patch Medias to hold 'extension' property?
	var media = require('pintura/media').Media.instances;
	for (var i in media) {
		var ext = media[i].extension;
		if (!ext)
			ext = i.split('/').slice(-1)[0];
		if (ext)
			types[ext] = i;
		if (mapping[ext])
			types[ext] = mapping[ext];
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
				var contentType = types[extension];
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
