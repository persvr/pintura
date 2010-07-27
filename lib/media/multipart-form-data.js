/**
 * Registers multi-part media type handling
 */
var parseMultipart = require("jsgi/multipart").parseMultipart,
	stringToValue = require("./auto-type").stringToValue,
	mediaModule = require("../media"),
	Media = require("../media").Media,
	fs = require("promised-io/fs"),
	defer = require("promised-io/promise").defer,
	IncomingForm = require("node-formidable/formidable/incoming_form").IncomingForm,
	Node = require("jsgi-node/jsgi/node").Node;
var parseMultipart = typeof process == "undefined" ?
	// jack form parser
	require("jack/utils").parseMultipart :
	// node form parser
	function(request){ 
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
	

Media({
	mediaType:"multipart/form-data",
	getQuality: function(object){
		return 0.2;
	},
	serialize: function(object, request){
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
	deserialize: function(inputStream, request){
    	return when(parseMultipart(request), function(form){
			for(var i in form){
				var value = form[i];
				if(value && typeof value === "object"){
					form[i] = mediaModule.onFile(value);
				}
				else{
					form[i] = stringToValue(value);
				}
			}
			return form;
		});
	}
});
