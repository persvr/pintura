/**
 * A remote client store that uses JSGI to retrieve data from remote sources
 */
var JSONExt = require("json-ext");
var httpRequest = require("jsgi-client").request;
var when = require("events").when;

exports.Remote = function(request, contextUrl){
	contextUrl = contextUrl || "";
	request = request || httpRequest;
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
			var response = request({
				method:"GET",
				pathInfo: '/' + id,
			});
			
			return JSONExt.parse(response.body);
		},
		put: function(object, id){
			var responsePromise= id ? 
				request({
					method: "PUT",
					pathInfo: '/' + id,
					body: JSONExt.stringify(object)
				}) :
				request({
					method: "POST",
					pathInfo: contextUrl,
					body: JSONExt.stringify(object)
				});
			return when(responsePromise, function(response){
					return JSONExt.parse(response.body)
				});
		},
		query: function(query, options){
			var headers = {};
			if(options.start || options.end){
				headers.range = "items=" + options.start + '-' + options.end; 
			}
			query = query.replace(/\$[0-9]/g, function(t){
				return JSON.stringify(options.parameters[t.substring(1) - 1]);
			});
			return when(request({
				method:"GET",
				queryString: query,
				headers: headers
			}), function(response){
				return JSONExt.parse(response.body)
			});
		},
		"delete": function(id){
			return request({
				method:"DELETE",
				url: pathInfo
			});
		},
		subscribe: function(options){
			listeners.push(options);
		},
		openObjectStore: function(storeName){
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