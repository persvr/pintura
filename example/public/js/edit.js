var pageName = location.search.match(/page=([^&]+)/);
pageName = pageName && pageName[1];
request({
	url: "Page/" + pageName,
	headers: {
		"accept": "application/javascript, application/json"
	}
}).then(function(response){
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

