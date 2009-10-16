/**
 * A remote client store that uses JSGI to retrieve data from remote sources
 */
var JSONExt = require("json-ext");
var request = require("jsgi-client").request;
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
			var response = request({
				method:"GET",
				url: id,
			});
			return JSONExt.parse(response.body);
		},
		put: function(object, id){
			if(id){
				request({
					method: "PUT",
					url: id,
					body: JSONExt.stringify(object)
				});
			}
			else{
				return JSONExt.parse(request({
					method: "POST",
					url: contextUrl,
					body: JSONExt.stringify(object)
				}).body);
			}
		},
		query: function(query, options){
			var headers = {};
			if(options.start || options.end){
				headers.range = "items=" + options.start + '-' + options.end; 
			}
			var response = request({
				method:"GET",
				url: id,
				headers: headers
			});
			return JSONExt.parse(response.body);
		},
		"delete": function(id){
			var response = request({
				method:"DELETE",
				url: id
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