/**
 * Registers a very primitive HTML handler
 */
var Media = require("../media").Media,
	getColumnsToExport = require("../media").getColumnsToExport,
	escapeHTML = require("narwhal-lib/html").escape;

Media({
	mediaType:"text/html",
	getQuality: function(object){
		// this is a pretty poor representation
		return 0.1;
	},
	serialize: function(object, request, response){
		//TODO: Eventually at least make this into a form that can be submitted to update the object 
		var columns;
		return {
			forEach: function(write){
				write("<html>");
				write("<body>");

				// give a visual representation of the object
				if(typeof object != "object"){
					write('' + object);
				}
				else if(object instanceof Array){
					write("<ol>");
					object.forEach(function(item){
						write("<li>");
						writeObject(item);
						write("</li>");
					});
					write("</ol>");
				}
				else{
					writeObject(object);
				}
				function writeObject(item){
					// the very first item determines the columns to be exported
					if (!columns) {
						columns = getColumnsToExport(request, item);
					}
					if (typeof item === "object") {
						write("<ul>");
						columns.forEach(function(i){
							write("<li>");
							write(escapeHTML(i) + " : " + escapeHTML('' + item[i]));
							write("</li>");
						});
						write("</ul>");
					} else {
						write(escapeHTML(escapeHTML(columns[0]) + " : " + item));
					}
				}

				write("<br /><button onclick='document.getElementsByTagName(\"textarea\")[0].style.display=\"block\";'>Show JS/JSON</button>");
				// Dojo likes to get the response in a textarea element
				write("<textarea style='display:none'>(");
				Media.instances["application/javascript"].serialize(object, request).forEach(function(block){
					write(block.replace(/<\s*\/\s*textarea/ig,"</text\"+\"area"));
				});
				write(")</textarea>");
				write("</body>");
				write("</html>");

			}
		}
	},
	deserialize: function(inputStream, request){
		throw new Error("not implemented");
	}
});
