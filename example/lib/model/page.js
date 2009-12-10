/**
 * This is a page model for the Wiki example application (in progress)
 */

var persisted = require("persisted"),
	Permissive = require("facet").Permissive,
	Restrictive = require("facet").Restrictive,
	DefaultStore = require("stores").DefaultStore,
	Notifying = require("store/notifying").Notifying;

// A pintura model consists of three primary layers: the store, the class, and the facet
// First we create the store for interacting directly with the storage endpoint 
var pageStore = require("stores").DefaultStore("Page");
/* We can switch to the SQL based back-end with: 
pageStore = require("page-sql").pageStore;
*/


/* To add full-text indexing 
pageStore = require("store/full-text").FullText(pageStore, "Page");
*/

// to add events
pageStore = Notifying(pageStore);

var auth = require("jsgi/auth");

// now we create a class, all central model logic is defined here 
var PageClass = exports.PageClass = persisted.Class("Page", pageStore, 
	{
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
/*
		create: function(object){
			return pageStore.create(object);
		},
*/
		prototype: {
			initialize: function(){
				this.status = "New";
			},
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
	});

// Now we create different facets for the different users that may access this data
// This facet uses the Restrictive constructor, so any modifying action must be explicilty
// be enabled (by defining a handler) 
exports.PublicFacet = Restrictive(PageClass, {
	query: function(query, options){
		query = "?status='published'" + (query.match(/^\?\w/) ? "&" : "") + query.substring(1);
		return PageClass.query(query, options);
	},
	prototype: {
	},
	quality:0.5
	
});

// This facet has full capability by default
exports.AdminFacet = Permissive(PageClass, {
	properties: {
	},
	quality: 1
});
