/**
 * Registers a very primitive HTML handler
 */
var Media = require("../media").Media;

Media({
	mediaType:"text/html",
	getQuality: function(object){
		// this is a pretty poor representation
		return 0.1;
	},
	serialize: function(object, request, response){
		//TODO: Eventually at least make this into a form that can be submitted to update the object 
		return {
			forEach: function(write){
				write("<html>");
				write("<body>");
				if(object instanceof Array){
					write("<ol>");
					object.forEach(function(item){
						write("<li>")
						writeObject(item);
						write("</li>")
					});
					write("</ol>");
				}
				else{
					writeObject(object);
				}
				write("</body>");
				write("</html>");
				function writeObject(object){
					write("<ul>");
					for(var i in object){
						if(object.hasOwnProperty(i)){
							write("<li>")
							write(escapeHTML(i) + " : " + escapeHTML('' + object[i]));
							write("</li>")
						}
					};
					write("</ul>");
				}
			}
		}
	},
	deserialize: function(inputStream, request){
		throw new Error("not implemented");
	}
});
function escapeHTML(string){
	return string.replace(/</g,"&lt;").replace(/&/g,"&amp;");
} 
