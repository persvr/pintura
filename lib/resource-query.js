/**
 * This module provides querying functionality 
 */
 
function throwMaxIterations(){
	throw new Error("Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
}
exports.maxIterations = 10000;
function stringToValue(string){
	switch(string){
		case "true": return true;
		case "false": return false;
		case "null": return null;
		default:
			var number = parseFloat(string, 10);
			if(isNaN(number)){
				var date = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(string);
	            if (date) {
	                return new Date(Date.UTC(+date[1], +date[2] - 1, +date[3], +date[4],
	                    +date[5], +date[6]));
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
		case "-+" : return "<";
		case "+-" : return ">";
		case "+=-" : return "=>";
		case "-=+" : return "=<";
	}
	return comparator;
}
exports.jsonQueryCompatible = true;
var parseQuery = exports.parseQuery = function(/*String*/query){
	if(exports.jsonQueryCompatible){
		query = query.replace(/%3C=/g,"-=+").replace(/%3E=/g,"+=-").replace(/%3C/g,"-+").replace(/%3E/g,"+-");
	}
	if(query.charAt(0)=="?"){
		query = query.substring(1);
	}
	var terms = [];
	var originalTerms = terms;
	if(query.replace(/([&\|,])?(([\w%\._\-]+)(=|!=|\-\+|\+\-|\-=\+|\+=\-)([\+\*\-:\w%\._]+)|(([\+\*\-\w%\._]+)(\(?))|(\)))/g,
					//      <-delim-> <--- name ---------    comparator   -------------- value  --------->|<-method/value--openParan->|<-closedParan->
		function(t, termDelimiter, expression, name, comparator, value, call, methodOrValue, openParan, closedParan){
			if(comparator){
				comparison = {
					type:"comparison", 
					comparator: convertComparator(comparator), 
					name: decodeURIComponent(name),
					value: stringToValue(value),
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
						method: methodOrValue,
						logic: termDelimiter
					};
					terms.push(callNode);
					callNode.parameters.parent = terms;
					terms = callNode.parameters;
				}
				else{
					// a value
					terms.push(stringToValue(methodOrValue));
				}
			}
			else if(closedParan){
				if(!terms.parent){
					throw new URIError("Closing paranthesis without an opening paranthesis");
				}
				terms = terms.parent;
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
exports.executeQuery = function(query, options, target){
	if(typeof query === "string"){
		query = parseQuery(query);
	}
	var methods = options.methods || {};
	if(!methods.sort){
		methods.sort = function(sortAttribute){
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
		}
	}
	var first = true;
	var js = "";
	query.children.forEach(function(child){
		if(child.type == "comparison"){
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
			var index = (options.parameters = options.parameters || []).push(child.value);
			if(child.comparator == "="){
				child.comparator = "==";
			}
			js += "item." + child.name + child.comparator + "options.parameters[" + (index -1) + "]";
			
		}
		if(!first){
			js += "});";
		}
		else if(child.type == "call"){
			if(methods[child.method]){
				var index = (options.parameters = options.parameters || []).push(child.children);
				js += "target = methods." + child.method + ".apply(target,options.parameters[" + (index -1) + "]);";
			}
			else{
				throw new URIError("Invalid JSON Query syntax, " + child.method + " not implemented");
			}
		}
		else{
			throw new URIError("Invalid JSON Query syntax, unknown type");
		}
	});
	return eval(js + "target;"); 
	
}
