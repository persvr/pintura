/**
 * Registers Atom media type handling
 */
var Media = require("../media").Media;

Media({
	mediaType:"application/atom+xml",
	getQuality: function(object){
		return 0.5;
	},
	serialize: function(object, env, response){
		return {
			forEach: function(write){
				var store = env.store;
				write('<?xml version="1.0" encoding="utf-8"?>\n\n');
				write('<feed xmlns="http://www.w3.org/2005/Atom">\n\n');
				write('<title>' + env.scriptName.substring(1) + '</title>\n');
				if(object instanceof Array){
					object.forEach(writeEntry);
				}
				else{
					writeEntry(object);
				}
				function writeEntry(item){
					write('<entry>\n');
					write('  <title>' + store.getTitle(item) + '</title>\n');
					if(store.getId){
						write('  <link href="' + store.getId(item) + '" />\n');
					}
					if(store.getUpdated){
						var updated = store.getUpdated(item);
						if(updated){
							updated = updated.toJson && updated.toJson();
							write('  <updated>' + updated + '</updated>\n');
						}
					}
					write('  <summary>' + store.getSummary(item) + '</summary>\n');
					write('</entry>\n');
				}
				write('</feed>');
			}
		};
	},
	deserialize: function(inputStream, env){
		throw new Error("not implemented yet");
	}
});