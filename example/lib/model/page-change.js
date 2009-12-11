/**
 * This class is used for tracking all the changes of a page
 */

var persisted = require("persisted"),
	DefaultStore = require("stores").DefaultStore,
	auth = require("jsgi/auth");

// This class contains  
var pageChangeStore = require("stores").DefaultStore("PageChange");
/* We can switch to the SQL based back-end with: 
pageStore = require("page-sql").pageStore;
*/

// now we create a class, all central model logic is defined here 
exports.PageChange = persisted.Class("PageChange", pageChangeStore, {
	links:[
		{
			rel: "current",
			href: "../Page/{pageId}"
		}
	]
});

// The facets for accessing the page class are defined in facet/page