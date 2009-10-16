/**
* A pubsub hub for distributing messages. Intended to be run as a worker
**/
var subscribers = {};

onmessage = function(event){	
	var request = JSON.parse(event.data);
	switch(request.method.toUpperCase()){
		case "POST":
			var topic = request.channel;
			notify(topic);
			topic = topic.replace(/\/[^\/]$/,'');
			notify(topic + "/*");
			while(topic){
				topic = topic.replace(/\/[^\/]$/,'');
				notify(topic + "/**");
			}
			function notify(subscribersForTopic){
				var subscribersForTopic = subscribers[topic];
				for(var i =0; i< subscribersForTopic.length;i++){
					subscribersForTopic[i].postMessage(request.body);
				}
			}
			break;
		case "SUBSCRIBE":
			var topic = request.topic;
			(subscribers[topic] = subscribers[topic] || []).push(event.ports[0]);
		case "UNSUBSCRIBE":
			var topic = request.topic;
			var subscribersForTopic = subscribers[topic];
			if(subscribersForTopic){
				subscribersForTopic.splice(subscribersForTopic.indexOf(event.ports[0]), 1);
			}
	}
	
}
