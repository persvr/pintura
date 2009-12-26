/**
* Media handler for generating HTML from Wiki markup-based pages
*/

var Media = require("../media").Media,
	escapeHTML = require("html").escapeHTML,
	wikiToHtml = require("wiky").toHtml; 
		
	
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
				if(typeof object === "object"){
					write('<p>Content: ');
					write('' + wikiToHtml(object.content));
					write('</p>');
				}
				else{
					write("<p>This page does not exist yet</p>");
				}
				write('<a href="/edit.html?page=' + pageName + '">' + action + ' this page</a>');	
			}
		};
	}
});

var rules = require("wiky").rules,
	store = require("wiky").store;
// add a rule for [[target page]] style links
rules.wikiinlines.push({ rex:/\[\[([^\]]*)\]\]/g, tmplt:function($0,$1,$2){return store("<a href=\""+$1+"\">"+$1+"</a>");}});
