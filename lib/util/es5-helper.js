/**
 * Various global cleanup operations
 */
// the problem with the narwhal es5 shim is that it throws when you set a property
// that can't be handled by the VM. We want to be able to set enumerable: false
// and other functions if possible, but not trigger errors
exports.defineProperties = Object.defineProperties && Object.defineProperties.toString().match(/native code/) ?
	Object.defineProperties :
	function(target, props){
		for(var i in props){
			var def = props[i];
			if(def.get){
				target.__defineGetter__(i, def.get);
			}
			if(def.set){
				target.__defineSetter__(i, def.set);
			}
			else if ("value" in def){
				target[i] = def.value;
			}
		}
		
	};
exports.defineProperty = Object.defineProperty && Object.defineProperty.toString().match(/native code/) ?
	Object.defineProperty :
	function(target, property, def){
			if(def.get){
				target.__defineGetter__(property, def.get);
			}
			if(def.set){
				target.__defineSetter__(property, def.set);
			}
		else if ("value" in def){
			target[property] = def.value;
		}
	};

/*(function(){
	var secureRandom = new java.security.SecureRandom();
	Math.random = function(){
		return secureRandom.nextDouble();
	};
/* should be handled by Narwhal's global function	
   if(!Object.defineProperty){
		Object.defineProperty = function(target, property, def){
			if(def.get || def.set){
				target.__defineGetter__(property, def.get);
				target.__defineSetter__(property, def.set);
			}
			else if ("value" in def){
				target[property] = def.value;
			}
		};
	}
	if(!Object.defineProperties){
		Object.defineProperties = function(target, props){
			for(var i in props){
				Object.defineProperty(target, i, props[i]);
			}
		};
	}
	if(!Object.create){
		Object.create = function(proto, properties){
			// classic beget/delegate function (albiet with the function declared inside for thread safety)
			function temp(){}
			temp.prototype = proto;
			var instance = new temp;
			Object.defineProperties(instance, properties);
			return instance;
		}
	}
})();*/
 