/**
 * This is a page model for the Wiki example application (in progress)
 */

var model = require("model"),
	DefaultStore = require("stores").DefaultStore,
	auth = require("jsgi/auth"),
	Notifying = require("store/notifying").Notifying,
	PageChange = require("./page-change").PageChange;

// Pintura consists of three primary layers: the store, the class (which acts as the 
// model), and the facet. Here we define the store and create the class for the store
// First we create the store for interacting directly with the storage endpoint 
var pageStore = require("stores").DefaultStore("Page");
/* We can switch to the SQL based back-end with: 
pageStore = require("./page-sql").pageStore;
*/


/* To add full-text indexing (only supported in Rhino) 
pageStore = require("store/full-text").FullText(pageStore, "Page");
*/

// to add events
pageStore = Notifying(pageStore, "Page");

// now we create a class, all central model logic is defined here 
exports.Page = model.Model("Page", pageStore, {
/*	We can create handlers for any of the actions, they will go directly to the store otherwise
	query: function(query, options){
		var sqlCondition = this.getWhereClause(query, options);

		if(sqlCondition){
			return pageStore.executeQuery(
				"SELECT id, title FROM Page WHERE " + sqlCondition, options);
		}
	},
*/
/*
	"delete": function(id){
		// any logic that we want on deletes
		// now call the store to actually do the delete
		pageStore["delete"](id);
	},
*/

	construct: function(page, directives){
		// set initial properties on object instantiation
		if(auth.currentUser){
			page.createdBy = auth.currentUser.username;
		}
		page.status = "published";
		return page.save(directives);
	},

	put: function(page, options){ // handle puts to add to history and define attribution
		if(auth.currentUser){
			// set the current user name as the lastModifiedBy property
			page.lastModifiedBy = auth.currentUser.username;
		}
		page.status = "published";
		// do the default action of saving to the store
		var pageId = pageStore.put(page, options) || page.id;
		// create a new change entry in the history log
		new PageChange({
			content: page.content,
			pageId: pageId
		});
		return pageId;
	},
	
	properties: { // schema definitions for property types (these are optional)
		status: String,
		content: String
	},

	prototype: { // define the methods available on the model object instances
		// these are used by atom
		getTitle: function(item){
			return item.name;
		},
		getSummary: function(item){
			return item.description;
		},
		getUpdated: function(item){
			return item.uploaded;
		}
		
	},
	links: [ // define the link relations with other objects
		{
			rel: "history", // link to the list of changes for a page
			href: "../PageChange/?pageId={id}"
		}
	]

	// this is flag to indicate that if Perstore should check to see an object exists when a PUT occurs, and call construct if it doesn't. The default is false	
	// noConstructPut: false,
});

// The facets for accessing the page class are defined in facet/page
