/**
 * A remote client store that uses JSGI to retrieve data from remote sources
 */
var JSONExt = require("../json-ext");
var request = require("../jsgi-client").request;
var wait = require("promise").wait;

exports.Remote = function(request){
	var entityStores = {};
	function remoteSubscribe(){
		request({
			method:"SUBSCRIBE",
			url: options.query
		}).then(notification, notification, function(message){
			remoteSubscribe();
			notification(message);
		});
	}
	//remoteSubscribe();
	var listeners = [];
	function notification(message){
		for(var i = 0;i < listeners.length; i++){
			var listener = listeners[i];
			try{
				if(listener.query(message.target)){
					listener.callback(message);
				}
			}
			catch(e){
				onerror(e);
			}
		}
	}

	return {
		get: function(id){
			var response = wait(request({
				method:"GET",
				pathInfo: id,
			}));
			
			return JSONExt.parse(response.body);
		},
		put: function(object, id){
			if(id){
				request({
					method: "PUT",
					pathInfo: id,
					body: JSONExt.stringify(object)
				});
			}
			else{
				return JSONExt.parse(wait(request({
					method: "POST",
					pathInfo: contextUrl,
					body: JSONExt.stringify(object)
				})).body);
			}
		},
		query: function(query, options){
			var headers = {};
			if(options.start || options.end){
				headers.range = "items=" + options.start + '-' + options.end; 
			}
			query = query.replace(/\$[0-9]/g, function(t){
				return JSON.stringify(options.parameters[t.substring(1) - 1]);
			});
			var response = wait(request({
				method:"GET",
				queryString: query,
				headers: headers
			}));
			return JSONExt.parse(response.body);
		},
		"delete": function(id){
			var response = request({
				method:"DELETE",
				url: pathInfo
			});
		},
		subscribe: function(options){
			listeners.push(options);
		},
		getEntityStore: function(storeName){
			// handle nested stores with nested paths
			var store = entityStores[storeName];
			if(store){
				return store;
			}
			return entityStores[storeName] = Remote(function(req){
				req.url = storeName + '/' + req.url;
				return request(req);
			})
		}
		
	};
};