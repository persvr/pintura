/**
 * JS Shell/Console
*/

try{
	//org.mozilla.javascript.tools.shell.Main.global = global;
}
catch(e){
	print("error initializing Rhino shell: " + e.message);
	// already initialized
}
try{
org.mozilla.javascript.tools.shell.Main.processSource(
	org.mozilla.javascript.Context.enter(), 
	null);
}catch(e){

}
print("jline failed");
// if jline is working properly, we shouldn't get to this point, but in eclipse jline doesn't work
var input = ""
do{
	do{
		var c = java.lang.Character.toString(java.lang.System["in"].read());
		input += c;
	}while(('' + c) != '\n');
		
	if (org.mozilla.javascript.Context.getCurrentContext().stringIsCompilableUnit(input))
	{
		// if it is syntactically finished, we evaluate
		try{
			var output = eval(input);
			if(output !== undefined){
				print('' + output);
			}
		}catch(e){
			print((e.rhinoException && e.rhinoException.printStackTrace()) || (e.name + ": " + e.message));
		}
		
		break;
	}
	print("  >");
}while(true);
