/**
* Media handler for generating HTML from Wiki markup-based pages
*/

var Media = require("../media").Media,
	escapeHTML = require("html").escapeHTML;

Media({
	mediaType:"text/html",
	getQuality: function(object){
		// this is a pretty poor representation
		return 1;
	},
	serialize: function(object, request, response){
		//TODO: Eventually at least make this into a form that can be submitted to update the object 
		return;
	}
});