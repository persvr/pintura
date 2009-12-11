var pageName = location.search.match(/page=([^&]+)/);
pageName = pageName && pageName[1];
document.title = "Editing " + pageName;
request({
	url: "Page/" + pageName,
	headers: {
		"accept": "application/javascript, application/json"
	}
}).then(function(response){
	if(!response.headers.username){
		login();
	}
	var page = eval("(" + response.body + ")");
	if(typeof page !== "object"){
		page = {
			id: pageName,
			content: ""
		};
	}
	var contentArea = document.getElementById("content-area");
	contentArea.value = page.content;

	document.getElementById("save-button").onclick = function(){
		page.content = contentArea.value;
		request({
			url: "Page/" + pageName,
			method: "PUT",
			body: JSON.stringify(page),
			headers: {
				"accept": "application/javascript, application/json"
			}
		});
	};

});

function login(){
	document.getElementById("login-form").style.display="block";
	document.getElementById("sign-in").onclick = function(){
		userRpc("authenticate").then(function(){
			alert("Logged in");
		}, errorHandler);
	};
	document.getElementById("register").onclick = function(){
		userRpc("createUser").then(function(){
			alert("Registered");
		}, errorHandler);
	};
	function errorHandler(error){
		alert(error);
	}
}

function userRpc(method, params){
	return request({
		url: "Class/User",
		method: "POST",
		body: JSON.stringify({
			id:"call-id",
			method: method,
			params: [
				document.getElementById("user").value,
				document.getElementById("password").value
			]
		}),
		headers: {
			"accept": "application/javascript, application/json"
		}
	}).then(function(response){
		response = JSON.parse(response);
		if(response.error){
			throw response.error;
		}
		return response.result;
	});
	}