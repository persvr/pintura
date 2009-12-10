var localSettings = eval('(' + require("file").read(require("packages").resource("local.json")) + ')');
for(var i in localSettings){
	exports[i] = localSettings[i];
}
