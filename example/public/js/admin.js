var path = location.pathname.match(/(.*\/)[^\/]*$/)[1];
if(location.toString().match(/file:/)){
	alert("You can't run this demo from the file system, you must run it with Persevere"); 
}
dojo.require("dojo.cookie");
dojo.require("dojox.data.JsonRestStore");
dojo.require("dojox.grid.DataGrid");
dojo.require("persevere.LoginLink");

if(path.lastIndexOf("example/") > -1){
	path = path.substring(0,path.lastIndexOf("example/"));
}

pageStore = new dojox.data.JsonRestStore({target: "Page/"});
if(!pageStore){
	console.log("Customer table doesn't exist, creating it now");
	dojo.xhr("POST",{url:"/Class/",sync: true, putData:'{"id":"Customer","extends":{"$ref":"Object"}}'},true); 
	pageStore = new dojox.data.PersevereStore({target:"/Customer/"}); // and get the Customer store
	// create a new item for starting data
	pageStore.newItem({firstName:"John", lastName:"Doe"});
	pageStore.save();
}

addItem = function() {
	pageStore.newItem({firstName: "firstName", lastName: "lastName",created:dojo.date.stamp.toISOString(new Date,{zulu:true})});
}
remove = function() {
	var items = grid.selection.getSelected();
	for (var i = 0; i < items.length; i++){
		pageStore.deleteItem(items[i]);
	}
}
