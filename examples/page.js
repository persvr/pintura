/**
 * This is a page model for the Wiki example application (in progress)
 */

var persisted = require("persisted"),
	Permissive = require("facet").Permissive,
	Restrictive = require("facet").Restrictive,
	SQLStore = require("store/sql").SQLStore;

// A pintura model consists of three primary layers: the store, the class, and the facet
// First we create the store for interacting directly with the storage endpoint 
var pageStore = SQLStore({
	table: "Page",
	starterStatements: [
		"CREATE TABLE Page (id INT NOT NULL AUTO_INCREMENT, title VARCHAR(100), status VARCHAR(10), content VARCHAR(100000), PRIMARY KEY(id))",
		],
	idColumn: "id"
});

// add full-text indexing 
pageStore = require("store/full-text").FullText(pageStore, "Page");

// this function is used to convert the JSONQuery to SQL (where id and title are the 
// acceptable columns to query on 
var queryToSql = require("store/sql").JsonQueryToSQLWhere("Page", ["id","title", "status"])
// this function is used to convert JSONQuery to Lucene full text query
var queryToFullText = require("store/full-text").JsonQueryToFullTextSearch("Page", ["id","title", "status"]);
var auth = require("jsgi/auth");
var AccessError = require("./errors").AccessError;

// now we create a class, all central model logic is defined here 
var PageClass = exports.PageClass = persisted.Class("Page", pageStore, 
	{
		query: function(query, options){
			var fulltext = queryToFullText(query, options);
			if(fulltext){
				return pageStore.fulltext(fulltext, ["title", "content"], options);
			}

			var sqlCondition = queryToSql(query, options);

			if(sqlCondition){
				return pageStore.executeSql(
					"SELECT id, title FROM Page WHERE " + sqlCondition, options).rows;
			}
		},
/*	We can create handlers for any of the actions, they will go directly to the store otherwise
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
		},
		getId: function(item){
			return item.id;
		}
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
