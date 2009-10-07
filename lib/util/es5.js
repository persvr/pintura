/**
 * Various global cleanup operations
 */
(function(){
	var secureRandom = new java.security.SecureRandom();
	Math.random = function(){
		return secureRandom.nextDouble();
	};
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
})();
 