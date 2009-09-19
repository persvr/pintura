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
	if(!Object.create){
		Object.create = function(proto, properties){
			function temp(){}
			temp.prototype = proto;
			var instance = new temp;
			Object.defineProperties(instance, properties);
			return instance;
		}
	}
})();
 