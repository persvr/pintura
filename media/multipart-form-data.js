/**
 * Registers multi-part media type handling
 */
var stringToValue = require("./auto-type").stringToValue,
	mediaModule = require("../media"),
	Media = require("../media").Media,
	fs = require("promised-io/fs"),
	when = require("promised-io/promise").when,
	all = require("promised-io/promise").all,
	defer = require("promised-io/promise").defer;
	
var parseMultipart = typeof process == "undefined" ?
	// jack form parser
	(function(httpUtil){
		return function(request){
			var parsed = httpUtil.parseFileUpload(request);
			return parsed;
		};
	})(require("ringo/utils/http")) :
	// node form parser
	(function(IncomingForm, Node){
		return function(request){ 
			var form = new IncomingForm();
			var deferred = defer();
			Node(function(request){
		    	form.parse(request, function(err, fields, files) {
		    		var incomingObject = {};
		    		if(err){
		    			return deferred.reject(err);
		    		}
		    		for(var i in files){
		    			fields[i] = files[i];
		    		}
		    		deferred.resolve(fields);
		    	});
			})(request);
			return deferred.promise;
		};
	})(
	require("formidable/lib/incoming_form").IncomingForm, 
	require("jsgi-node/jsgi/node").Node);
	

Media({
	mediaType:"multipart/form-data",
	getQuality: function(object){
		return 0.2;
	},
	serialize: function(object, parameters, request){
		var boundary = Math.random().toString().substring(2);
		return {
			forEach:function(write){
				for(var i in object){
					if(object.hasOwnProperty(i)){
						write("--" + boundary + '\n');
						write("Content-Disposition: form-data; name=" + i + "\n\n" + object[i] + '\n');
					}
				}
				write("--" + boundary + '--\n\n');
			},
			"content-type": "multipart/form-data; boundary=" + boundary
		}
	},
	deserialize: function(inputStream, parameters, request){
    	return when(parseMultipart(request), function(form){
    		var files = [];
    		var fileKeys = [];
			for(var i in form){
				var value = form[i];
				if(value && typeof value === "object"){
					files.push(mediaModule.saveFile(value));
					fileKeys.push(i);
				}
				else{
					form[i] = stringToValue(value);
				}
			}
			return when(all(files), function(files){
				for(var i = 0; i < files.length; i++){
					form[fileKeys[i]] = files[i];
				}
				return form;
			});
		});
	}
});
