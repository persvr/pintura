var AccessError = exports.AccessError =function(message){
	var error = Error.apply(this, arguments);
	this.message = message;
	this.name = "AccessError";
	return this;
};
AccessError.prototype = new Error;

var MethodNotAllowedError = exports.MethodNotAllowedError =function(message){
	var error = Error.apply(this, arguments);
	this.message = message;
	this.name = "MethodNotAllowedError";
	return this;
};
MethodNotAllowedError.prototype = new AccessError;

var DatabaseError = exports.DatabaseError = function(code,message){
	Error.call(this, message);
	this.message = message;
	this.name = "DatabaseError";
	this.code = code;
};
DatabaseError.prototype = new Error();

var NotFoundError = exports.NotFoundError = function(message){
	DatabaseError.call(this, 3, message);
	this.name = "NotFoundError";
};
NotFoundError.prototype = new DatabaseError();
