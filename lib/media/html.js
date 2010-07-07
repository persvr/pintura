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
				// give a visual representation of the object

				// honor AJAH
				if (!request.xhr) {
					write("<html>");
					write("<body>");
				}

				// honor possible templating
				var t;
				if (typeof request.template === 'function')
					write(request.template(object, request, response));
				else if (/*request.template &&*/ (t=exports.tryRender(request.template, object, request, response)))
					write(t);
				else if(typeof object !== "object"){
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

				if (!request.xhr) {
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
		}
	},
	deserialize: function(inputStream, request){
		throw new Error("not implemented");
	}
});

function dir(){var sys=require('sys');for(var i=0,l=arguments.length;i<l;i++)sys.debug(sys.inspect(arguments[i]));}
exports.tryRender = function(template, object, request, response){
	//return 'RENDERED:'+request.scriptName+':-->:'+template;
	//return require('promised-io/promise').when(require('fs').readFile('views'+request.scriptName + '.haml', 'utf8'), function(html, hhh){
	/*return require('fs').readFile('views'+request.scriptName + '.haml', 'utf8', function(err, markup){
		if (err) throw err;
		dir('OK!'+markup);
		return markup;
	});*/
	// extend haml to support includes
	var haml = require('haml/haml');
	haml.include = function(template){
		try {
			return require('promised-io/fs').read('views/' + template + '.1haml', 'utf8');
		} catch (x) {
			return require('promised-io/fs').read('views/list.haml', 'utf8');
		}
	};
	// extend haml to support partials
	haml.partial = function(template, locals){
		var html = haml.include(template);
		//dir("HTML:", html);
		return haml.render(html, {
			context: haml, // N.B. this will be 'this' in templates
			locals: locals, // variables available to the templates
			//debug: options.debug,
			//cache: options.cache,
			//filename: template
		});
	};
	var locals = request.vars || {};
	locals.items = object.toRealArray();
	locals.entity = request.scriptName.substring(1);
	locals.keys = getColumnsToExport(request, locals.items[0]);
	return haml.partial(template || locals.entity, locals);
};
