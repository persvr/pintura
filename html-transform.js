exports['text/plain'] = function(obj){
	return bufferText(obj);
}

//util to buffer objects that might be streamed for converters that need this
function bufferText(obj){
	var buffered = "";
	if (obj.forEach){
		obj.forEach(function(c){buffered+=c.decodeToString()});
	}else if (typeof obj=='string'){
		buffered = obj;	
	}else{
		buffered = obj.toString();
	}
	return buffered;
}
	

exports['text/wiki'] = function(obj){
	return require("markdown").toHTML(bufferText(obj));
}	

exports['application/x-rst'] = exports['text/wiki'];
