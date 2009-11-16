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
		get: function(id){
			return adapter.mapObject(id);
		},
		put: function(object, id){
			id = id || object[parameters.idColumn];
			if(id !== undefined){
				if(!adapter.mapObject(id)){
					id = undefined;
				}
			}
			if(id === undefined){
				id = adapter.recordNewObject(object);
				object[parameters.idColumn] = id;
				return id;
			}
			adapter.recordUpdate(id, object);
			
			return id;
		},
		executeSql: function(query, options){
			// should roughly follow executeSql in http://www.w3.org/TR/webdatabase/
			return {rows:extendSome(adapter.executeSql(query, options))};			
		},
		"delete": function(id){
			adapter.recordDelete(id);
		},
		commitTransaction: function(){
			adapter.commitTransaction();
		},
		abortTransaction: function(){
			adapter.abortTransaction();
		}
	}
}

