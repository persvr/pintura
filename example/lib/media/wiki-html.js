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
		var action;
		if(response.status === 404){
			action = "create";
			object = "This page does not exist yet";
		}
		else if(response.status === 200){
			action = "edit";
		}
		return {
			forEach:function(write){
				write('<html><title>' + pageName + '</title>\n');
				write('<style type="text/css">@import "/css/common.css";</style>\n');
				write('<body><div id="headerContainer"><span class="pageName">' + pageName + '<span></div>\n');
				write('<div id="content">\n');
				if(typeof object === "object"){
					write('' + wikiToHtml(object.content));
				}
				else{
					write("<p>" + object + "</p>\n");
				}
				if(action){
					write('<p><a href="/edit.html?page=' + pageName + '">' + action + ' this page</a></p>\n');
				}	
				write('</div></body></html>\n');
			}
		};
	}
});

var rules = require("wiky").rules,
	store = require("wiky").store;
// add a rule for [[target page]] style links
rules.wikiinlines.push({ rex:/\[\[([^\]]*)\]\]/g, tmplt:function($0,$1,$2){return store("<a href=\""+$1+"\">"+$1+"</a>");}});
