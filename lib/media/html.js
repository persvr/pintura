/**
* Media handler for generating HTML from Wiki markup-based doc
*/

var Media = require("media").Media,
	filesystem = require("perstore/store/filesystem").FileSystem({fsRoot: "templates"}),
	transform = require("perstore/html-transform"),
	Response=require("pintura/jsgi/response").Response,
	resolver = require("cjsTemplate").Resolver;

var templateEngine =  require('cjsTemplate').TemplateEngine({resolver: resolver, store: filesystem});



Media({
	mediaType:"text/html",
	defaultQuality: .1,
	getQuality: function(object){

		//so we can have pretty html error responses 
		if (!object) {return 1; }

		var contentType = object.getMetadata? object.getMetadata()['content-type'] : object['content-type'];

		if (contentType) {

			// html is being requested, we're ideal
			if (contentType=="text/html") { return 1; }

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

		print("templateId: " + templateId);	

		if (!object && !response.status){
			response.status = 404;
		}else if ((!response.status || (response.status < 400)) && transform && meta['content-type']){
			try {
				if (transform[meta['content-type']]){
					object = transform[meta['content-type']](object);
				}
			}catch(err){
				print("error transforming content");
				response.status=500;
			}
		}
	


		//TODO update template so we can stream the template rendering
		if (response.status > 400) {
			//print("Error Response: " + response.status);
			template = templateEngine.compile("/error/"+response.status);	
			rendered = template(response);
		}else{
			template = templateEngine.compile(templateId, (mediaParams && mediaParams.template));
			rendered = template(object);
		}

		
		response.headers['content-length'] = rendered.length+2;  // this doesn't seem correct, but without the +2 it doesn't get everything.
		response.headers['content-type']="text/html";

		return {
			forEach:function(write){
					write(rendered);
			}
		};
	},
	deserialize: function(inputStream, request){
		throw new Error("not implemented");
	}
});
