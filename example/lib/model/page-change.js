/**
 * This class is used for tracking all the changes of a page
 */

var Model = require("model").Model,
	DefaultStore = require("stores").DefaultStore,
	auth = require("jsgi/auth");

// This class contains  
var pageChangeStore = require("stores").DefaultStore("PageChange");
/* We can switch to the SQL based back-end with: 
pageChangeStore = SQLStore({
	table: "PageChange",
	idColumn: "id"
	indexedProperties:{
		id: true,
		pageId: true
	}
});
*/

// now we create a class, all central model logic is defined here 
exports.PageChange = Model("PageChange", pageChangeStore, {
	properties: {
		content: String,
		pageId: {
			type: "integer",
			description:"This is the id for the current page from the Page model"
		}
	},
	links:[
		{
			rel: "current",
			href: "../Page/{pageId}"
		}
	]
});

// The facets for accessing the page class are defined in facet/page