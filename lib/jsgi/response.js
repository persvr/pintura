
// this simply exists to brand responses so REST handlers and RPC methods can optionally
// return a JSGI response
exports.Response = Response;
function Response(response){
	this.__isJSGIResponse__ = true;
	for(var i in response){
		this[i] = response[i];
	}
};
