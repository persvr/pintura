/**
* Declarative subset of JavaScript with a few extras beyond JSON, including
* dates, non-finite numbers, etc.
* Derived from and uses:
http://www.JSON.org/json2.js
    2008-11-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 
 */

require("json");

var nativeJson = !!JSON.parse.toString().match(/native code/);
exports.parse = function (text) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

    var j;

    function walk(value) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

        var k;
        if (value && typeof value === 'object') {
            for (k in value) {
            	var v = value[k];
		        if (typeof v === 'string') {
		            var a =
		/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(v);
		            if (a) {
		                value[k] = new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
		                    +a[5], +a[6]));
		            }
		        }
            	else if (typeof v === 'object') {
                	walk(v);
            	}
            }
        }
    }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

    cx.lastIndex = 0;
    if (cx.test(text)) {
        text = text.replace(cx, function (a) {
            return '\\u' +
                ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        });
    }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
var backSlashRemoved = text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
    if (/^[\],:{}\s]*$/.
test(backSlashRemoved.
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
    	// it is pure JSON
    	if(nativeJson){
    		// use the native parser if available
    		j = JSON.parse(text);
    	}
    	else{
    		// revert to eval
    		j = eval('(' + text + ')');
    	}
		walk(j);
        return j;
    }
    else if (/^[\],:{}\s]*$/.
test(backSlashRemoved.
replace(/"[^"\\\n\r]*"|new +Date\([0-9]*\)|[a-zA-Z]+\s*:(?:\s*\[)*|true|false|null|undefined|-?Infinity|NaN|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
    	// not pure JSON, but safe declarative JavaScript
		j = eval('(' + text + ')');
		walk(j);
        return j;
    }

// If the text is not JSON parseable, then a SyntaxError is thrown.

    throw new SyntaxError('JSON.parse');
};

var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;



exports.stringify = ({}).toSource ?
	// we will use toSource if it is available 
	function(root){
		if(root && typeof root == "object" || typeof root == "function"){
			var source = root.toSource();
			if(source.charAt(0) == "("){
				// remove the surrounding paranthesis that are produced
				source = source.substring(1, source.length - 1);
			}
			return source;
		}
		if(typeof value === "number" && !isFinite(value)){
			return value.toString();
		}
		if(typeof value === "undefined"){
			return "undefined";
		}
		return JSON.stringify(value);
	} : 
	function(root){
		return JSON.stringify(root, function(value){
			if(value instanceof Date){
				return "new Date(" + value.getTime() + ")";
			}
			if(typeof value === "number" && !isFinite(value)){
				return value.toString();
			}
			if(typeof value === "undefined"){
				return "undefined";
			}
			if(typeof value === 'function'){
				return value.toString();
			}
		});
	};
	
	
	
	
