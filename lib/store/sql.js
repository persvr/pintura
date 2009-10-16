/**
 * This is an SQL store for Rhino
 */
exports.SQLStore = require("./sql-engine").SQLStore;

var QueryRegExp = require("json-query").QueryRegExp;
exports.JsonQueryToSQL = function(tableName, selectColumns, indexedColumns){
	var selectSql = "SELECT " + (typeof selectColumns === "string" ? selectColumns : selectColumns.join(",")) + " FROM " + tableName;
	return function(query){
		if((matches = query.match(
			QueryRegExp(/^(\[\?$prop=$value\])?(\[[\/\\]$prop\])?$/)))){
			var sql = selectSql;
			if(matches[2]){
				if(indexedColumns.indexOf(matches[2]) == -1){
					throw new Error("Can only query by " + indexedColumns.join(","));
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