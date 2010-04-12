var file = require("file");
//TODO: optionally write to target file 
exports.Transporter = function(options, app) {
    var options = options || {},
        prefix = options.urlPrefix || "/lib/",
        resolveDeps = "resolveDeps" in options ? options.resolveDeps : true,
        paths = options.paths || require.paths.map(function(path){
        	return path.replace(/[\\\/]engines[\\\/](\w*)/,function(t, engine){
        		return "/engines/" + (engine === "default" ? "default" : "browser");
        	});
        }),
        converter = options.converter || exports.CommonJS; 
    
    return function(request) {
    	var modules, isPaused, path = request.pathInfo;
		if(path.indexOf(prefix) != 0){
			if(app){    
				return app(request);
			}
			return {
	            status: 404,
	            headers: {
	            	"Content-Type": "application/javascript"
	            },
	            body: ["Not found"]
	        };
		}
		var requestedModules = path.substring(prefix.length, path.length)
			.split(',').map(function(module){
				if(module.substring(module.length - 3, module.length) == ".js"){
					return module.substring(0, module.length - 3); // strip the .js
				}
				return module;
			});
		if(findPath(requestedModules[0] + ".js")){
	        modules = {};
	        return {
	        	status: 200,
	        	headers: {},
	        	body: {
	        		forEach: function(write){
        				requestedModules.filter(function(module){
							if(module.charAt(0) === "-"){
								module = module.substring(1);
								// find all the module and deps treat them as already loaded
								loadModule(module);
								return;
							}
							return true;
        				}).forEach(function(module){
							if(module){
	        					loadModule(module, write);
							}
        				});
        				if(isPaused){
	        				write("require.resume();\n");
        				}
        				if(requestedModules.length > 1){
        					write('require.def("' + requestedModules.join(",") + '", [], function(){});');
        				}
	        		}
	        	}
	        };
		}
		// couldn't find the path
        return {
            status: 404,
            headers: {},
            body: ["Not found"]
        };
        function findPath(moduleName){
	        for (var i = 0; i < paths.length; i++){
	        	var path = file.join(paths[i], moduleName);
				if(file.isFile(path)){
					return path;
				}
	        }
        }
        function loadModule(moduleName, write){
        	if(modules[moduleName]){
        		if(modules[moduleName] === 1 && !isPaused && write){
        			// we need to pause to get all the dependencies loaded
	       			write("require.pause();\n");
        			isPaused = true;
        		}
        		return;
        	}
        	modules[moduleName] = 1; // in progress
        	var path = findPath(moduleName + ".js");
        	if(!path && write){
        		write('console.error(' + JSON.stringify(moduleName) + ' + " not found");\n');
        		return;
        	}
	        var fileContents = file.read(path);
	        if(moduleName === "require"){
	        	// require.js loads the require handler, which can't be embedded in 
	        	// require.def because require doesn't exist yet
	        	// also hand-coded modules that define their require.def's don't need wrapping/resolution, 
	        	// they can be directly written
	        	var baseUrl = request.pathInfo.substring(0, request.pathInfo.lastIndexOf("/") + 1);
	        	// we set the base url in the require config so that it knows where to load from
	        	write('require={baseUrlMatch:RegExp("' + requestedModules[0] + '")};');
	        	write(fileContents);
	        	return;
	        }
	        if(fileContents.indexOf("require.def(") > -1){
	        	// also hand-coded modules that define their require.def's don't need wrapping/resolution, 
	        	// they can be directly written
	        	write(fileContents);
	        	return;	        	
	        }
	        converter(moduleName, fileContents, resolveDeps ? loadModule : function(){}, modules, write);
			modules[moduleName] = 2; // finished
        }
    }
}

// CommonJS module wrapper
exports.CommonJS = function(moduleName, fileContents, loadModule, modules, write){
    var deps = [];
    var depNames = {};
    var baseModule = moduleName.substring(0, moduleName.lastIndexOf("/") + 1);
    fileContents.replace(/require\s*\(\s*['"]([^'"]*)['"]\s*\)/g, function(t, moduleId){
    	if(moduleId.charAt(0) == "."){
    		// handle relative references
    		moduleId = (baseModule + moduleId).replace(/\/\.\.\/[^\/]*/g,'').replace(/\.\//g,'');
    	}
    	if(depNames[moduleId]){
    		return;
    	}
    	depNames[moduleId] = true;
    	deps.push(moduleId);
		loadModule(moduleId, write);
    });
    if(write){
        write('require.def("');
        write(moduleName);
        write('", ["require", "exports", "module"');
        write((deps.length ? ', "' + deps.join('", "') + '"' : '') + '], ');
		write('function(require, exports, module) {');
        write(fileContents);
        write('\n});\n');
	}
};

// Dojo module wrapper
exports.Dojo = function(moduleName, fileContents, loadModule, modules, write){
    var deps = [];
    var depNames = {};
    var baseModule = moduleName.substring(0, moduleName.lastIndexOf("/") + 1);
    fileContents.replace(/dojo\.require\s*\(\s*['"]([^'"]*)['"]\s*\)/g, function(t, moduleId){
    	moduleId = moduleId.replace(/\./g,'/');
    	if(depNames[moduleId]){
    		return;
    	}
    	depNames[moduleId] = true;
    	deps.push(moduleId);
		loadModule(moduleId, write);
    });
    if(write){
        write(fileContents);
	}
};

// Dojo module wrapper
exports.DojoRequireJS = function(moduleName, fileContents, loadModule, modules, write){
    var deps = [];
    var depNames = {};
    var baseModule = moduleName.substring(0, moduleName.lastIndexOf("/") + 1);
    fileContents.replace(/dojo\.require\s*\(\s*['"]([^'"]*)['"]\s*\)/g, function(t, moduleId){
    	moduleId = moduleId.replace(/\./g,'/');
    	if(depNames[moduleId]){
    		return;
    	}
    	depNames[moduleId] = true;
    	deps.push(moduleId);
		loadModule(moduleId, write);
    });
    if(write){
        write('require.def("');
        write(moduleName);
        write('", [');
        write((deps.length ? '"' + deps.join('", "') + '"' : '') + '], ');
		write('function() {');
        write(fileContents);
        write('\n});\n');
	}
};