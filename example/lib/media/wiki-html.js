/**
* Media handler for generating HTML from Wiki markup-based pages
*/

var Media = require("../media").Media,
	escapeHTML = require("html").escapeHTML;

Media({
	mediaType:"text/html",
	getQuality: function(object){
		return 1;
	},
	serialize: function(object, request, response){
		var pageName = escapeHTML(request.pathInfo.substring(1));
		var action = "edit";
		if(response.status === 404){
			action = "create";
		}
		return {
			forEach:function(write){
				write('<html><title>' + pageName + '</title>');
				write('<body><h1>' + pageName + '</h1>');
				write('<p>Content: ');
				if(object){
					write('' + object.content);
				}
				write('</p>');
				write('<a href="edit.html?page=' + pageName + '">' + action + ' this page</a>');	
			}
		};
	}
});