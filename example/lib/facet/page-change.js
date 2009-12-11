/**
 * These are the page facets for the Wiki example application (in progress)
 */

var PageChange = require("model/page-change").PageChange,
	Permissive = require("facet").Permissive,
	Restrictive = require("facet").Restrictive;


// These are the different facets that are available for accessing this data
// This facet uses the Restrictive constructor, so any modifying action must be explicilty
// be enabled (by defining a handler) 
exports.PublicFacet = Restrictive(PageChange, {
	prototype: {
	},
	quality:0.5
	
});
// note that general users can't change page history

// This facet is for administrators and grants full access to data
exports.AdminFacet = Permissive(PageChange, {
	properties: {
	},
	quality: 1
});
