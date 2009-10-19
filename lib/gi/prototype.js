var stores = require("stores");

var MySQL = require("stores/MySQL").MySQL;
var Lucene = require("stores/Lucene").Lucene;

Class({
	id:"Prototype",
	query: function(query, target, start, end){
		var fulltext = query.match(/fulltext\($value\)/);
		if(fulltext){
			console.log(fulltext[1], start, end);
			return store.fulltext(JSON.parse(fulltext[1].toString()), start, end);
		}
		console.log("no match");
	},
	prototype:{
		hello: function(){console.log("hi")},
		onSave: function(){
			validateComponent(this.component);
		}
		
	}
});
      
var store = persvr.registerStore(Prototype, Lucene(MySQL), {
		"connection":"jdbc:mysql://localhost/prototype?user=root&password=&useUnicode=true&characterEncoding=utf-8",
		"dataColumns":[
			"name",
			"rating",
			"ratingsCount",
			"downloads",
			"license_id",
			"uploaded",
			"enabled",
			"description",
			"component",
			"user",
			"featured"
		],
		"table":"Prototype",
		"starterStatements":[
			"CREATE TABLE Prototype (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(100), rating FLOAT, ratingsCount INT, downloads INT, license_id INT, uploaded DATETIME, enabled BOOL, description VARCHAR(2000), component VARCHAR(100000), user VARCHAR(100), featured BOOL)"],
		"idColumn":"id"
	});
console.log("store",store);


function validateComponent(component){
		var parser = DocumentBuilderFactory.newInstance().newDocumentBuilder();
		var doc = parser.parse(component).getDocumentElement();
		if("urn:tibco.com/v3.0" != doc.getAttribute("xmlns")){
			throw new Error("Invalid root element for component");
		}
		var nl = doc.getChildNodes();
		var objectElement;
		for(var i = 0; i < nl.getLength(); i++){
			var child = nl.item(i);
			if(child.getTagName){
				var tagName = child.getTagName();
			
				if(tagName == "object"){
					if(objectElement){
						throw new Error('Multiple object elements are not allowed');
					}
					objectElement = child;
				}
			if(tagName == "onAfterDeserialization" || tagName == "onBeforeDeserialization"){
				var deserializationNl = child.getChildNodes();
				for(var j = 0; j < deserializationNl.getLength(); j++){
					deserializationChild = deserializationNl.item(j);
					if(deserializationChild.getTagName){ 
						throw new Error(tagName + " can not have children");
					}
					if(!deserializationChild.getNodeValue().match(/^\s*$/)){
						throw new Error(tagName + " can not have any contents");
					}
				}	
			
			}				
		}
		if(!objectElement || bjectElement.getChildNodes().getLength() == 0){
			throw new Error('Serialization element must have a valid "object" element');
		}
	}
}