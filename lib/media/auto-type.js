/**
 * Attempt to guess the best type for values that come as string only
 */

exports.stringToValue = function(string){
	switch(string){
		case "true": return true;
		case "false": return false;
		case "null": return null;
		default:
			var number = parseFloat(string, 10);
			if(isNaN(number)){
				return string;
			}
			return number;
	}
	
};