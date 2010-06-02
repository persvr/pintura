/**
 * Constant indicating if a method expects a body 
 */

exports.METHOD_HAS_BODY = {
	get:false,
	head:false,
	"delete": false,
	options:false,
	copy: false,
	move: false,
	unlock: false,
	subscribe: false,
	unsubscribe: false,
	
	put:true, 
	post:true, 
	trace: true, 
	propfind: true, 
	proppatch: true, 
	mkcol: true, 
	lock: true, 
	patch: true
};
