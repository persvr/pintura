/**
 * This executes the next app in a transaction, adding a transaction object
 * as the interface for accessing persistent and commiting the transaction
 * if successful, otherwise if an error is thrown, the transaction will be aborted
 */
exports.Transactional = Transactional;
var when = require("events").when;

function Transactional(database, nextApp){
	return function(request){
		if(request.jsgi.multithreaded){
			print("Warning: Running Pintura in a multithreaded environment may cause non-deterministic behavior");
		}
		var response;
		database.transaction(function(transaction){
			request.transaction = transaction;
			response = nextApp(request);
		}, getPrecondition(request));
		return response;
	};
}

function getPrecondition(request){
	return function(){
		return true;
	}
}
