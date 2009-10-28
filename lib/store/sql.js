/**
 * This is an SQL store for Rhino
 */
var RawSQLStore = require("./sql-engine").SQLStore;
exports.SQLStore = function(parameters){
	var store = RawSQLStore(parameters);
	store.getSchema= function(){
		if(parameters.type == "mysql"){
			var results = store.executeSql("DESCRIBE " + parameters.table, {});
			var schema = {properties:{}};
			results.forEach(function(column){
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
	return store;
}

var QueryRegExp = require("../json-query").QueryRegExp;
exports.JsonQueryToSQL = function(tableName, selectColumns, indexedColumns){
	var selectSql = "SELECT " + (typeof selectColumns === "string" ? selectColumns : selectColumns.join(",")) + " FROM " + tableName;
	return function(query, options){
		if((matches = query.match(
			QueryRegExp(/^(\[?\?\(?(?:@\.)?$prop=$value\)?\]?)?(\[[\/\\]$prop\])?$/)))){
			var sql = selectSql;
			if(matches[2]){
				if(indexedColumns.indexOf(matches[2]) == -1){
					throw new Error("Can only query by " + indexedColumns.join(","));
				}
				if(!options){
					throw new Error("Values must be set as parameters on the options argument, which was not provided");
				}
				options.parameters = [eval(matches[3].toString())];
				sql += " WHERE " + matches[2] + "=?";
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