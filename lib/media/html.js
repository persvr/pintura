/**
* Media handler for generating HTML from Wiki markup-based doc
*/

var Media = require("../media").Media,
	filesystem = require("perstore/store/filesystem").FileSystem({dataFolder: "../templates"}),
	transform = require("../html-transform"),
	Response=require("../jsgi/response").Response,
	resolver = require("templify/templify").Resolver,
	when = require("promised-io/promise").when;
var templateEngine =  require('templify/templify').TemplateEngine({resolver: resolver, store: filesystem});

Media({
	mediaType:"text/html",
	defaultQuality: .1,
	getQuality: function(object){

		var contentType = object.getMetadata? object.getMetadata()['content-type'] : object['content-type'];

		if (contentType) {

			// we have an available transformer
			if (transform && transform[contentType]) { 
				return 1;
			}else{
				return this.defaultQuality
			}
		}

		//we want to be the default handler if there isn't a specific handler for a request already
		return this.defaultQuality
	},
	serialize: function(object, mediaParams, request, response){
		var template,content;
		
		var meta = object.getMetadata ? object.getMetadata() : {};
		
		var templateId = mediaParams.template || request['scriptName'] + request['pathInfo'];
		templateId = mediaParams.templateType ? templateId + "-" + mediaParams['templateType'] : templateId;

		if (!object && !response.status){
			response.status = 404;
		}else if ((!response.status || (response.status < 400)) && transform && meta['content-type']){
			object = transform[meta['content-type']](object);
		}

		//delete any existing content-length headers as the size has changed post conversion/templating
		delete response.headers['content-length'];

		//TODO update template so we can stream the template rendering
		if (response.status > 400) {
			template = templateEngine.compile("/error/"+response.status);	
		}else{
			template = templateEngine.compile(templateId, (mediaParams && mediaParams.template));
		}

			
		return {
			forEach: function(write){
				return when(template, function(template){
					write(template(object));
				})
			}
		}
	},
	deserialize: function(inputStream, request){
		throw new Error("not implemented");
	}
});
