/**
 * This is an SQL store for Rhino
 */
var extendSome = require("lazy").extendSome;
var drivers = {
	mysql: "com.mysql.jdbc.Driver",
	sqlite: "org.sqlite.JDBC",
	derby: "org.apache.derby.jdbc.EmbeddedDriver",
	hsqldb: "org.hsqldb.jdbcDriver",
	oracle: "oracle.jdbc.driver.OracleDriver",
	postgres: "org.postgresql.Driver"
}
exports.SQLStore = function(parameters){
	var adapter = new org.persvr.store.SQLStore();
	if(drivers[parameters.type]){
		parameters.driver = drivers[parameters.type]; 
	}
	adapter.initParameters(parameters);
	return {
		startTransaction: function(){
			adapter.startTransaction();
		},
		executeSql: function(query, parameters){
			// should roughly follow executeSql in http://www.w3.org/TR/webdatabase/
			var rawResults = adapter.executeSql(query, parameters);
			var results = {rows:extendSome(rawResults)};
			if(rawResults.insertId){
				results.insertId = rawResults.insertId; 
			}
			return results;
		},
		commitTransaction: function(){
			adapter.commitTransaction();
		},
		abortTransaction: function(){
			adapter.abortTransaction();
		}
	}
}

