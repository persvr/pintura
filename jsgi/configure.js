/**
 * Middleware for configuring middleware with a fluent API
 */
var NotFoundError = require('perstore/errors').NotFoundError;

module.exports = function(configuration){
	var root;
	function configuredApp(request){
		// delegate to the root, so we can rebuild the root,
		// if and when we reconfigure
		return root(request);
	}
	function end(request){
		throw new NotFoundError('unhandled request');
	}
	var configurationMap;
	function build(){
		configurationMap = {};
		var current = end;
		var appConfig;
		try{
			for(var i = configuration.length; i-- > 0;){
				appConfig = configuration[i];
				var factory = null;
				var configArgument = null;
				if(typeof appConfig === 'function'){
					factory = appConfig;
					appConfig = {
						factory: factory
					};
				}else if(typeof appConfig === 'string'){
					factory = require(appConfig);
					appConfig = {
						factory: factory,
						module: appConfig
					};
				}else if(typeof appConfig.module === 'string'){
					factory = require(appConfig.module);
					configArgument = appConfig.config;
				}else if(typeof appConfig.factory === 'function'){
					factory = appConfig.factory;
					configArgument = appConfig.config;
				}else{
					throw new Error('Invalid configuration, no app or module provided ' + JSON.stringify(appConfig));
				}
				configuration[i] = appConfig;
				configurationMap[getId(appConfig)] = appConfig;
				current = appConfig.app = configArgument === null ? 
					factory(current) :
					// it needs a configuration
					factory(configArgument, current);
				if(typeof current !== 'function'){
					throw new Error('JSGI app factory did not return a function');
				}
			}
		}catch(error){
			console.error('failed to configure JSGI app', appConfig, error);
			throw error;
		}
		root = current;
	}

	function getId(config){
		var module = typeof config === 'string' ? 
			config : config.module;
		if(module){
			return module.match(/[^\/]+$/)[0];
		}
		return (config.factory || config.app).name;
	}

	build();
	function reconfigure(newConfiguration){
		configuration = newConfiguration;
		build();
	}
	configuredApp.reconfigure = reconfigure;

	// create delegate array methods
	function arrayMethod(mutates){
		return function(method){
			configuredApp[method] = function(){
				// delegate the method to the configuration array
				var result = [][method].apply(configuration, arguments);
				if(mutates){
					// rebuild after any change was made
					build();
				}
				return result;
			};
		};
	}
	['push', 'pop', 'unshift', 'shift', 'splice', ''].forEach(arrayMethod(true));
	['slice', 'forEach', 'map', 'reduce', 'reduceRight'].forEach(arrayMethod());
	['filter', 'every', 'some'].forEach(function(method){
			configuredApp[method] = function(callback, thisObject){
				if(typeof callback == 'string'){
					// convert string search to a search by name
					var nameToSearch = callback;
					callback = function(item){
						return getId(item) === nameToSearch;
					};
				}
				// delegate the method to the configuration array
				return configuration[method](callback, thisObject);
			};
		});
	configuredApp.indexOf = function(searchFor, starting){
		if(typeof searchFor === 'string'){
			for(var i = starting || 0, l = configuration.length; i < l; i++){
				if(getId(configuration[i]) === searchFor){
					return i;
				}
			}
			return -1;
		}
		return configuration.indexOf(searchFor, starting);
	};
	configuredApp.lastIndexOf = function(searchFor, starting){
		if(typeof searchFor === 'string'){
			for(var i = starting || configuration.length; i-- > 0;){
				if(getId(configuration[i]) === searchFor){
					return i;
				}
			}
			return -1;
		}
		return configuration.lastIndexOf(searchFor, starting);
	};
	configuredApp.get = function(id){
		return configuredApp.filter(id)[0];
	};
	configuredApp.set = function(id, config){
		var index = configuredApp.indexOf(id);
		if(index > -1){
			configuredApp.splice(index, 1, config);
		}else{
			configuredApp.push(config);
		}
	};
	configuredApp.delete = function(id){
		var index = configuredApp.indexOf(id);
		if(index > -1){
			configuredApp.splice(index, 1);
		}
	};
	configuredApp.asArray = function(){
		return configuration;
	};
	return configuredApp;
};