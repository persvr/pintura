/**
 * Registers Atom media type handling
 */
var Media = require("../media").Media;

Media({
	mediaType:"application/atom+xml",
	getQuality: function(object){
		return 0.5;
	},
	serialize: function(object, parameters, request, response){
		return {
			forEach: function(write){
                var title = request.scriptName.substring(1);
                var qs = "?" + request.queryString;
				write('<?xml version="1.0" encoding="utf-8"?>\n');
				write('<feed xmlns="http://www.w3.org/2005/Atom">\n');
				write('<title>' + title + '</title>\n');
				if (request.store.description) {
					write('<subtitle>' + request.store.description + '</subtitle>');
				}
				write('<link rel="alternate" type="text/html" href="' + (qs.length > 1 && qs || '') + '"/>\n');
				if(typeof object.forEach === "function") {
					var range = require("../util/parse-header")["content-range"](response.headers["content-range"], 25);
					 // TODO escape entities, especially in qs
                    if (range.prev) {
                        var prevRange = [range.prev.start, range.prev.end].join("-");
                        write('<link rel="prev" type="application/atom+xml" href="' + qs + '&amp;http-range=items%3d' + prevRange + '&amp;http-accept=application/atom+xml" title="Previous"/>\n');
                    }
                    if (range.next) {
                        var nextRange = [range.next.start, range.next.end].join("-");
                        write('<link rel="next" type="application/atom+xml" href="' + qs + '&amp;http-range=items%3d' + nextRange + '&amp;http-accept=application/atom+xml" title="Next"/>\n');
					}
                    object.forEach(writeEntry);
				}
				else{
					writeEntry(object);
				}
				function writeEntry(item){
					var updated;
					if (typeof item.getUpdated === "function") {
						// TODO is this even necessary? can't we just use last-modified?
						updated = item.getUpdated();
					}
					else if (typeof item.getMetadata === "function" && item.getMetadata()["last-modified"]) {
						updated = item.getMetadata()["last-modified"];
					}
					
					write('<entry>\n');
					write('  <title>' + item.getTitle() + '</title>\n');
					write('  <link href="' + (item.getId ? item.getId() : item.id) + '" />\n');
					if (updated){
						updated = updated.toJSON && updated.toJSON() || updated;
						write('  <updated>' + updated + '</updated>\n');
					}
					write('  <summary>' + item.getSummary() + '</summary>\n');
					write('</entry>\n');
				}
				write('</feed>');
			}
		};
	},
	deserialize: function(inputStream, parameters, request){
		throw new Error("not implemented yet");
	}
});