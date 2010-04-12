require("require");
require("json");
var pageName = location.search.match(/page=([^&]+)/);
pageName = pageName && pageName[1];
document.title = "Editing " + pageName;
var request = require("jsgi-client").request;
var escapeHTML = require("html").escapeHTML;
document.getElementById("main-header").innerHTML = escapeHTML("Editing " + pageName);
debugger;
request({
	uri: "Page/" + pageName,
	headers: {
		"accept": "application/javascript, application/json"
	}
}).then(function(response){
	if(!response.headers.username){
		login();
	}
	var page = eval("(" + response.body.join("") + ")");
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
			uri: "/Page/" + pageName,
			method: "PUT",
			body: JSON.stringify(page),
			headers: {
				"accept": "application/javascript, application/json",
				"content-type": "application/json"
			}
		}).then(function(){
			// redirect to the page once it is saved
			location = "/Page/" + pageName;
		}, errorHandler);
	};

}, errorHandler);

function login(){
	document.getElementById("login-form").style.display="block";
	document.getElementById("sign-in").onclick = function(){
		userRpc("authenticate").then(function(){
			document.getElementById("login-form").style.display="none";
			alert("Logged in");
		}, errorHandler);
	};
	document.getElementById("register").onclick = function(){
		userRpc("createUser").then(function(){
			alert("Registered");
		}, errorHandler);
	};
}

function userRpc(method, params){
	return request({
		uri: "Class/User",
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
			"accept": "application/javascript, application/json",
			"content-type": "application/json"
		}
	}).then(function(response){
		response = eval('(' + response.body.join("") + ')');
		if(response.error){
			throw response.error;
		}
		return response.result;
	});
	}

function errorHandler(error){
	alert(error);
}


	