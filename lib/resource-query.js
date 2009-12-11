/**
 * This module provides querying functionality 
 */
 

exports.jsonQueryCompatible = true;
var parseQuery = exports.parseQuery = function(/*String*/query, parameters){
	if(exports.jsonQueryCompatible){
		query = query.replace(/%3C=/g,"=le=").replace(/%3E=/g,"=ge=").replace(/%3C/g,"=lt=").replace(/%3E/g,"=gt=");
	}
	if(query.charAt(0)=="?"){
		query = query.substring(1);
	}
	var terms = [];
	var originalTerms = terms;
	if(query.replace(/([&\|,])?(([\+\*\-:\w%\._]+)(=|=?<|=?>|!=|=[a-z]*=)([\+\*\$\-:\w%\._]+)|(([\+\*\\$-:\w%\._]+)(\(?))|(\))|(.+))/g,
		 //      <-delim-> <--- name ---------  comparator   -----   value  ---->|<-function/value -- openParan->|<-closedParan->|<-illegalCharacter->
		function(t, termDelimiter, expression, name, comparator, value, call, functionOrValue, openParan, closedParan, illegalCharacter){
			if(comparator){
				var comparison = {
					type:"comparison", 
					comparator: convertComparator(comparator), 
					name: convertPropertyName(name),
					value: stringToValue(value, parameters),
					logic: termDelimiter
				};
				terms.push(comparison);
			}
			else if(call){
				if(openParan){
					// a function call
					var callNode = {
						type:"call", 
						parameters:[],
						name: convertPropertyName(functionOrValue),
						logic: termDelimiter
					};
					terms.push(callNode);
					callNode.parameters.parent = terms;
					terms = callNode.parameters;
				}
				else{
					// a value
					terms.push(stringToValue(functionOrValue, parameters));
				}
			}
			else if(closedParan){
				if(!terms.parent){
					throw new URIError("Closing paranthesis without an opening paranthesis");
				}
				terms = terms.parent;
			}
			else if(illegalCharacter){
				throw new URIError("Illegal character in query string encountered " + illegalCharacter);
			}
			return "";
		})){
		// any extra characters left over from the replace indicates invalid syntax
		throw new URIError("Invalid query syntax");
	}
	return terms;
	/*
	var TOKEN = /\(|[\w%\._]+/g;
var OPERATOR = /[-=+!]+|\(/g;
var NEXT = /[&\|\)]/g;
	
	TOKEN.lastIndex = 0;
	function group(){
		var ast = [];
		var match = TOKEN.exec(query);
		if(match === '('){ 
			ast.push(group());
		}
		else{
			OPERATOR.lastIndex = TOKEN.lastIndex;
			var operator = OPERATOR.exec(query);
			var comparison = {};
			ast.push(comparison);
			if(operator == '('){
				comparison.type = "call";
				comparison.parameters = 
			}
			comparison.type = operator;
			
		}
		return ast;
	}
	return group();*/
}
exports.QueryFunctions = function(){
	
}
exports.QueryFunctions.prototype = {
	sort: function(sortAttribute){
		var firstChar = sortAttribute.charAt(0);
		var ascending = true;
		if(firstChar == "-" || firstChar == "+"){
			if(firstChar == "-"){
				ascending = false;
			}
			sortAttribute = sortAttribute.substring(1);
		}
		this.sort(function(a, b){
			return ascending == a[sortAttribute] > b[sortAttribute] ? 1 : -1; 
		});
		return this;
	},
	"in": function(){
		var indexOf = Array.indexOf;
		return this.some(function(item){
			return indexOf(arguments, item) > -1;
		});
	},
	select: function(first){
		if(arguments.length == 1){
			return this.map(function(object){
				return object[first];
			});
		}
		var args = arguments;
		return this.map(function(object){
			var selected = {};
			for(var i = 0; i < args.length; i++){
				var propertyName= args[i];
				if(object.hasOwnProperty(propertyName))
				selected[propertyName] = object[propertyName];
			}
		});
	},
	slice: function(){
		return this.slice.apply(this, arguments);
	}
};
exports.executeQuery = function(query, options, target){
	if(typeof query === "string"){
		query = parseQuery(query, options && options.parameters);
	}
	var functions = options.functions || exports.QueryFunctions.prototype;
	var first = true;
	var js = "";
	query.forEach(function(term){
		if(term.type == "comparison"){
			if(!options){
				throw new Error("Values must be set as parameters on the options argument, which was not provided");
			}
			if(first){
				js += "target = target.filter(function(item){return ";
				first = false;
			}
			else{
				js += query.logic + query.logic;
			}
			var index = (options.parameters = options.parameters || []).push(term.value);
			if(term.comparator == "="){
				term.comparator = "==";
			}
			js += "item." + term.name + term.comparator + "options.parameters[" + (index -1) + "]";
			
		}
		else if(term.type == "call"){
			if(!first){
				js += "});";
				first = false;
			}
			if(functions[term.name]){
				var index = (options.parameters = options.parameters || []).push(term.parameters);
				js += "target = functions." + term.name + ".apply(target,options.parameters[" + (index -1) + "]);";
			}
			else{
				throw new URIError("Invalid JSON Query syntax, " + term.name + " not implemented");
			}
		}
		else{
			throw new URIError("Invalid JSON Query syntax, unknown type");
		}
	});
	if(!first){
		js += "});";
		first = false;
	}
	return eval(js + "target;"); 
	
}
function throwMaxIterations(){
	throw new Error("Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
}
exports.maxIterations = 10000;
function stringToValue(string, parameters){
	switch(string){
		case "true": return true;
		case "false": return false;
		case "null": return null;
		default:
			var number = parseFloat(string, 10);
			if(isNaN(number)){
				if(string.indexOf(":") > -1){
					var date = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(string);
		            if (date) {
		                return new Date(Date.UTC(+date[1], +date[2] - 1, +date[3], +date[4],
		                    +date[5], +date[6]));
		            }
					var parts = string.split(":",2);
					switch(parts[0]){					
						case "boolean" : return Boolean(parts[1]);
						case "number" : return parseFloat(parts[1], 10);
						case "string" : return decodeURIComponent(parts[1]);
						case "date" : return new Date(parts[1]);
						case "null" : return null;
						default: 
							throw new URIError("Unknown type " + parts[0]);
					}
				}
				if(string.charAt(0) == "$"){
					return parameters[parseInt(string.substring(1)) - 1];
				}
				string = decodeURIComponent(string);
				if(exports.jsonQueryCompatible){
					if(string.charAt(0) == "'" && string.charAt(string.length-1) == "'"){
						return JSON.parse('"' + string.substring(1,string.length-1) + '"');
					}
				}
				return string;
			}
			return number;
	}
	
};
function convertComparator(comparator){
	switch(comparator){
		case "=lt=" : return "<";
		case "=gt=" : return ">";
		case "=le=" : return "=>";
		case "=ge=" : return "=<";
		case "==" : return "=";
	}
	return comparator;
}

function convertPropertyName(property){
	if(property.indexOf(".") > -1){
		return property.split(".").map(function(part){
			return decodeURIComponent(part);
		});
	}
	return decodeURIComponent(property);
}