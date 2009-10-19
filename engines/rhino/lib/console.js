/**
 * JS Shell/Console
*/

try{
	var global = org.mozilla.javascript.tools.shell.Main.global;
	global = new org.mozilla.javascript.NativeJavaObject(global, global, null);
	if(!global.isInitialized()){
		global.init(org.mozilla.javascript.Context.enter());
	}
}
catch(e){
	// already initialized
}
org.mozilla.javascript.tools.shell.Main.processSource(
	org.mozilla.javascript.Context.enter(), 
	null);