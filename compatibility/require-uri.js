/*
 * The require-uri module provides a backwards compatible technique for 
 * requiring modules with URLs. This is designed to be used at the top of a module:
 * require = require("require-uri").getRequire(require);
 */


exports.getRequire = function(require){
	return function(id){
		if(module.supportsUri || id.charAt(0) === '.'){
			// if we support URLs, use the real require
			return require(id);
		}
		id = resolveUri("", id, mappings);
		if(id.indexOf(":") === -1){
			return require(id);
		}
		// otherwise pray that required module is in the path
		try{
			return require(id.split("/lib/")[1]);
		}
		catch(e){
			e.message += " Was trying to load module from " + id + 
				" and failed, check to ensure it is installed locally or use the web-modules asynchronous loader";
			throw e;
		}
	};
};


function resolveUri(currentId, uri, mappings){
	if(uri.charAt(0) === '.'){
		currentId = currentId.substring(0, currentId.lastIndexOf('/') + 1);
		return [(currentId + uri).replace(/\/\.\.\/[^\/]*/g,'').replace(/\.\//g,'')];
	}
	else{
		return (mappings && mappings.some(function(mapping){
			var from = mapping.from;
			if(uri.substring(0, from.length) == from){
				return mapping.to + uri.substring(from.length);
			}
		})) || uri;
	}
}

var engine = typeof process !== "undefined" ? "node" : "narwhal";
var mappingsArray = [];
var allMappings = {};
exports.installPackage = function(packageData){
	function addMappings(mappings){
		if(mappings){
			mappingsArray = mappingsArray.concat(Object.keys(mappings).filter(function(key){
				return !(key in allMappings);
			}).map(function(key){
				var to = mappings[key];
				return {
					from: key,
					to: resolveUri(packageUri, typeof to == "string" ? to : to.to)
				};
			}).sort(function(a, b){
				return a.from.length < b.from.length ? 1 : -1;
			}));
		}
	}
	if(packageData.overlay){
		Object.keys(packageData.overlay).forEach(function(condition){
			try{
				var matches = (engine == condition) || eval(condition);
			}catch(e){}
			if(matches){
				addMappings(packageData.overlay[condition].mappings);
			}
		});
	}
	addMappings(packageData.mappings);
}

exports.installPackage({
	mappings:{		
		"perstore/": "",
		"commonjs-utils/": "",
		"pintura/": "",
		"wiky/": ""
	}
});