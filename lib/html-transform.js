exports['text/plain'] = function(obj){
	return bufferText(obj);
}

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
	return {id: obj.id || "noid", content: require("markdown").toHTML(bufferText(obj))};
}	

exports['application/x-rst'] = exports['text/wiki'];
