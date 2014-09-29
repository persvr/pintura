/**
 * This is the top level Pintura module, that delegates functionality to the different components
 * within Pintura, setting up the different middleware to create the full Pintura JSGI app
 * and defining the default mechanisms for security, content negotiation, and persistence.
 */
// load the default media types
require('./media/json');
require('./media/javascript');
require('./media/url-encoded');
require('./media/atom');
require('./media/multipart-form-data');
require('./media/html');
require('./media/uri-list');
require('./media/plain');
require('./media/message/json');

var configure = require('./jsgi/configure');
var config = exports.config = {
	mediaSelector: require('./media').Media.optimumMedia,
	database: require('perstore/stores'),
	security: require('./security').DefaultSecurity(),
	responseCache: require('perstore/store/memory').Memory({path: 'response'}), //require('perstore/store/filesystem').FileSystem('response', {defaultExtension: 'cache',dataFolder: 'cache' }),
	serverName: 'Pintura',
	customRoutes: [],
	getDataModel: function(request){ 
		return exports.getDataModel(request);
	}
};
exports.getDataModel = function(){ 
	throw new Error('You must assign a getDataModel method to the pintura config object in order to expose data');
};
exports.app = configure([
		// This is the set of JSGI middleware and appliance that comprises the Pintura
		// request handling framework.
		{module: './context', config: {}},		
		// We detect if the request could have been forged from another site
		'./csrf',
		// Support handling various cross-site request mechanisms like JSONP, window.name, CS-XHR
		'./xsite',
		// Handle header emulation through query parameters (useful for cross-site and links)
		'./http-params',
		// Handle HEAD requests
		'./head',
		// Add some useful headers
		{module: './pintura-headers', config: config.serverName},
		// Handle conditional requests
		{module: './conditional', config: true},
		// Handle response conneg, converting from JS objects to byte representations 
		{factory: require('./jsgi/media').Serialize, config: config.mediaSelector},
		// Handle errors that are thrown, converting to appropriate status codes
		'./error',
		//	Handle transactions
		'perstore/jsgi/transactional',
		// Handle sessions
		{module: './session', config: {}},
		// Do authentication
		{module: './auth', config: config.security},
		// Handle request conneg, converting from byte representations to JS objects
		{factory: require('./jsgi/media').Deserialize, config: config.mediaSelector},
		// Non-REST custom handlers
		{module: './routes', config: config.customRoutes},
		// Add and retrieve metadata from objects
		'./metadata',
		// Final REST handler
		{module: './rest-store', config: config}
	]);


var Connector = require('tunguska/connector').Connector;
exports.addConnection = exports.app.addConnection = function(connection){
	Connector('local-workers', connection);
	connection[connection.on ? 'on' : 'observe']('message', function(message){
		message.pathInfo = message.channel || message.to;
		if(message.method && message.method !== 'subscribe'){
			exports.directApp(message);
		}
	});
};
