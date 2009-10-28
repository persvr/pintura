var stores = require("./stores");
var SchemaFacet = require("./facet").SchemaFacet;
var SQLStore = require("./store/sql").SQLStore;


var store = SQLStore({
	connection: "jdbc:mysql://localhost/prototype?user=root&password=&useUnicode=true&characterEncoding=utf-8",
	table: "Sample",
	type: "mysql",
	starterStatements: [
		"CREATE TABLE Sample (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(100), foo VARCHAR(100), num FLOAT, PRIMARY KEY(id))"],
	idColumn: "id"
});

// we can full-text index the store
// store = require("./store/lucene").Lucene(store, "Sample");

var QueryRegExp = require("./json-query").QueryRegExp;
var queryToSql = require("./store/sql").JsonQueryToSQL("Sample", ["id", "name", "foo"], ["id", "name", "foo"])
var deepCopy = require("./util/copy").deepCopy;

var SampleClass = stores.registerStore("Sample", store, deepCopy(store.getSchema(),
	{
		query: function(query, options){
/*			// if you want to do full-text searches:
			var matches;
			
			if(matches = query.match(
					QueryRegExp(/^\?fulltext\($value\)$/))){
				return store.fulltext(eval(matches[1]), options);
			}*/
			var sql = queryToSql(query, options);
			if(sql){
				return store.executeSql(sql, options);
			}
		},
		properties:{
			foo: {
				type: "string",
				set: function(value, source, oldValue){
					// we can do some validation in here
					// source is the store object that is wrapped
					return value;
				}
			},
			name: {
				type: "string"
			}
		},
		prototype: {
			initialize: function(){
				this.num=3;
			},
			save: function(){
				print("save is occuring");
			},
			incrementNum: function(rating){
				// could be called through JSON-RPC	
				this.num++;
				this.save();
			}
		}
	}));
	
// read-only facet for some users
SchemaFacet({
	additionalProperties: {readonly: true},
	appliesTo: SampleClass,
	prototype: {
		incrementNum: function(rating, source){
			source.incrementNum();
			this.load();
		}
		
	}
});


// if this our jackconfig:
exports.app = require("jack/cascade").Cascade([ 
		// cascade from static to pintura REST handling
	require("jack/static").Static(null,{urls:[""],root:["web"]}),
	pintura.app
]);

// I like to have a console when jack is running
new (require("worker").SharedWorker)("console");