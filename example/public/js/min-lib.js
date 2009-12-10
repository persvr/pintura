var xhr = function(jsgiObject){
};		var page = location.search.match(/page=\/([^&])/);
		page = page && page[1];
		var xhr = XMLHttpRequest();
		xhr.open("GET", "Page/" + page, true);
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4){
				var page = eval("(" + xhr.responseText + ")");
				var contentArea = document.getElementById("content-area");
				contentArea.value = page.content;
				document.getElementById("save-button").onclick = function(){
					contentArea.value
				};
			}
		};
		xhr.send(null);
