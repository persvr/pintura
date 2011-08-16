/*
 * maps /Foo/1.html to /Foo/1 Accept: text/html
 * maps /Foo/1.bar to request.pathInfo: /Foo/1,
 * 			request.headers.accept: text/html+bar
 */

exports.Extension = function(mapping, nextApp){
	var types = {};
	// collect registered media types
	// TODO: may be patch Medias to hold 'extension' property?
	var media = require('pintura/media').Media.instances;
	for (var i in media) {
		var ext = media[i].extension;
		if (!ext)
			ext = i.split('/').slice(-1)[0];
		if (ext)
			types[ext] = i;
	}
	// apply user specified mapping
	for (var i in mapping) {
		types[i] = mapping[i];
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
				// N.B. if extension is present, but content type is not found? ->
				// assume Accept: text/html and extension is name of template
				if (!contentType) {
					contentType = 'text/html';
					// N.B. rough attempt to avoid local file inclusion attack
					var template = extension.replace(/[^\w]/g, '');
					// select corresponding media serializer
					if (template)
						contentType += '+'+template;
				}
				request.headers.accept = contentType;
//require('sys').debug('EXT: ' + contentType);
				request.pathInfo = path.substring(0, path.length - extension.length - 1);
				// /Foo/1.json --> /Foo/1 Accept: application/json
				// /Foo.json --> /Foo/ Accept: application/json
				/*if (request.pathInfo.split('/').length < 3) {
					request.pathInfo += '/';
				}*/
			}
		}
		return nextApp(request);
	};
};
