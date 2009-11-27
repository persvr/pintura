/**
 * This is an SQL database engine for Rhino
 * based on http://www.w3.org/TR/webdatabase/
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
exports.SQLDatabase = function(parameters){
	var adapter = new org.persvr.store.SQLStore();
	if(drivers[parameters.type]){
		parameters.driver = drivers[parameters.type]; 
	}
	adapter.initParameters(parameters);
	return {
		transaction: function(callback){
			adapter.startTransaction();
			var suceeded;
			try{
				var result = callback({
					executeSql: function(query, parameters){
						// should roughly follow executeSql in http://www.w3.org/TR/webdatabase/
						var rawResults = adapter.executeSql(query, parameters);
						var results = {rows:extendSome(rawResults)};
						if(rawResults.insertId){
							results.insertId = rawResults.insertId; 
						}
						return results;
					}
				});
				adapter.commitTransaction();
				suceeded = true;
				return result;
			}
			finally{
				if(!suceeded){
					adapter.abortTransaction();
				}
			}
		}
	};	
}

