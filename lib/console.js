/**
 * JS Shell/Console
*/
var Sandbox = require("sandbox").Sandbox;
while(true){
	print("next");
	    var sandbox = Sandbox({
            "system": system,
            "loader": require.loader,
            "debug": require.loader.debug
        });
        sandbox("console-engine");
}