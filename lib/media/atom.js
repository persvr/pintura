/**
 * Registers Atom media type handling
 */
var Media = require("../media").Media;

Media({
	mediaType:"application/atom+xml",
	getQuality: function(object){
		return 0.5;
	},
	serialize: function(object, request, response){
		return {
			forEach: function(write){
				write('<?xml version="1.0" encoding="utf-8"?>\n\n');
				write('<feed xmlns="http://www.w3.org/2005/Atom">\n\n');
				write('<title>' + request.scriptName.substring(1) + '</title>\n');
				if(object instanceof Array){
					object.forEach(writeEntry);
				}
				else{
					writeEntry(object);
				}
				function writeEntry(item){
					write('<entry>\n');
					write('  <title>' + item.getTitle() + '</title>\n');
					write('  <link href="' + (item.getId ? item.getId() : item.id) + '" />\n');
					//if(item.getUpdated){
						var updated = item.getUpdated();
						if(updated){
							updated = updated.toJSON && updated.toJSON();
							write('  <updated>' + updated + '</updated>\n');
						}
					//}
					write('  <summary>' + item.getSummary() + '</summary>\n');
					write('</entry>\n');
				}
				write('</feed>');
			}
		};
	},
	deserialize: function(inputStream, request){
		throw new Error("not implemented yet");
	}
});