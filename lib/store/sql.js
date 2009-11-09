/**
 * This is an SQL store for Rhino
 */
var RawSQLStore = require("./sql-engine").SQLStore;
var AutoTransaction = require("../stores").AutoTransaction;
try{
	var DATABASE = require("settings").DATABASE;
}catch(e){
	print("No settings file defined");
}
exports.SQLStore = function(parameters){
	for(var i in DATABASE){
		if(!(i in parameters)){
			parameters[i] = DATABASE[i];
		}
	}
	var store = RawSQLStore(parameters);
	store.getId = function(object){
		return object[parameters.idColumn];
	}
	store.getSchema= function(){
		if(parameters.type == "mysql"){
			store.startTransaction();
			var results = store.executeSql("DESCRIBE " + parameters.table, {});
			store.commitTransaction();
			var schema = {properties:{}};
			results.some(function(column){
				schema.properties[column.Field] = {
					"default": column.Default,
					type: [column.Type.match(/(char)|(text)/) ? "string" :
						column.Type.match(/tinyint/) ? "boolean" :
						column.Type.match(/(int)|(number)/) ? "number" :
						"any", "null"]
				};
				if(column.Key == "PRI"){
					schema.links = [{
						rel: "full",
						hrefProperty: column.Field
					}];
				}
			});
			return schema;
		}
		return {properties:{}};
	};
	return AutoTransaction(store);
}

var QueryRegExp = require("../json-query").QueryRegExp;
exports.JsonQueryToSQLWhere = function(tableName, indexedColumns){
	return function(query, options){
		if((matches = query.match(
			QueryRegExp(/^(\[?\?\(?(?:@\.)?$prop=$value\)?\]?)?\??(\[[\/\\]$prop\])?$/)))){
			var sql = " ";
			if(matches[2]){
				if(indexedColumns.indexOf(matches[2]) == -1){
					throw new Error("Can only query by " + indexedColumns.join(","));
				}
				if(!options){
					throw new Error("Values must be set as parameters on the options argument, which was not provided");
				}
				options.parameters = [eval(matches[3].toString())];
				sql += matches[2] + "=? ";
			}
			else{
				sql += "1=1 ";
			}
			if(matches[5]){
				if(indexedColumns.indexOf(matches[5]) == -1){
					throw new Error("Can only sort by " + indexedColumns.join(","));
				} 
				sql += " ORDER BY " + matches[5] + " " + (matches[4].charAt(1) == '/' ? "ASC" : "DESC");
			}
			return sql;
		}
	}
};

exports.nameValueToSQL = function(query, options){
};