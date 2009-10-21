exports.deepCopy = function deepCopy(source, target, overwrite){
	for(var i in source){
		if(source.hasOwnProperty(i)){
			if(typeof source[i] === "object" && typeof target[i] === "object"){
				deepCopy(source[i], target[i], overwrite);
			}
			else if(overwrite || !target.hasOwnProperty(i)){
				target[i] = source[i];
			}
		}
	}
	return target;
};