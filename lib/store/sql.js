/**
 * This is an SQL store that (partially) implements: 
 * http://www.w3.org/TR/WebSimpleDB/
 * and wraps an SQL database engine based on: 
 * based on http://www.w3.org/TR/webdatabase/
 */
var SQLDatabase = require("./sql-engine").SQLDatabase;
var first = require("lazy").first;
var AutoTransaction = require("../stores").AutoTransaction;
var parseQuery = require("../resource-query").parseQuery;
var defineProperty = require("../util/es5-helper").defineProperty;

exports.SQLStore = function(config){
	var database = config.database || exports.defaultDatabase();
	var store = { 
		indexedColumns: ["id"],
		selectColumns: ["*"],
		get: function(id){
			var object = first(store.executeSql("SELECT * FROM " + config.table + " WHERE " + config.idColumn + "=?", [id]).rows);
			if(object){
				defineProperty(object.__proto__ = {
					getId: function(object){
						return this[config.idColumn];
					}
				}, "getId", {enumerable: false});
			}
			return object;
		},
		"delete": function(id){
			store.executeSql("DELETE FROM " + config.table + " WHERE " + config.idColumn + "=?", [id]);
		},
		put: function(object, id){
			id = id || object[config.idColumn];
			if(id !== undefined){
				if(!this.get(id)){
					id = undefined;
				}
			}
			var params = [];
			var valuesPlacement = "";
			var columnsString = "";
			if(id === undefined){
				var first = true;
				for(var i in object){
					if(object.hasOwnProperty(i)){
						params.push(object[i]);
						valuesPlacement += first ? "?" : ",?";
						columnsString += (first ? "" : ",") + i;
						first = false;
					}
				}
				var results = store.executeSql("INSERT INTO " + config.table + " (" + columnsString + ") values (" + valuesPlacement + ")", params);
				id = results.insertId;
				object[config.idColumn] = id;
				return id;
			}
			var sql = "UPDATE " + config.table + " SET ";
			var first = true;
			for(var i in object){
				if(object.hasOwnProperty(i)){
					if(first){
						first = false;
					}
					else{
						sql += ",";
					}
					sql += i + "=?";
					params.push(object[i]);
				}
			}
			sql += " WHERE " + config.idColumn + "=?";
			params.push(object[config.idColumn]);
			store.executeSql(sql, params);
			
			return id;
		},
		query: function(query, options){
			options = options || {};
			return this.executeQuery("SELECT " + this.selectColumns + " FROM " + config.table +
				" WHERE " + this.getWhereClause(query, options), options);		
		},
		getWhereClause: function(query, options){
			if(typeof query === "string"){
				query = parseQuery(query);
			}
			var sql = "";
			if(!options){
				throw new Error("Values must be set as parameters on the options argument, which was not provided");
			}
			var indexedColumns = this.indexedColumns;
			var params = (options.parameters = options.parameters || []);
			query.forEach(function(term){
				if(term.type == "comparison"){
					addClause(term.name, term.name + term.comparator + "?");
					params.push(term.value);
				}
				else if(term.type == "call"){
					if(term.name == "sort"){
						if(!sql){
							sql += "1=1";
						}
						var sortAttribute = term.parameters[0];
						var firstChar = sortAttribute.charAt(0);
						var orderDir = "ASC";
						if(firstChar == "-" || firstChar == "+"){
							if(firstChar == "-"){
								orderDir = "DESC";
							}
							sortAttribute = sortAttribute.substring(1);
						}
						if(indexedColumns.indexOf(sortAttribute) == -1){
							throw new URIError("Can only sort by " + indexedColumns.join(","));
						} 
						sql += " ORDER BY " + sortAttribute + " " + orderDir;
					}
					else if(term.name instanceof Array && term.name[1] === "in"){
						var name = term.name[0];
						if(term.parameters.length == 0){
							// an empty IN clause is considered invalid SQL
							if(sql){
								sql += term.logic == "&" ? " AND " : " OR ";
							}
							sql += "0=1";
						}
						else{
							addClause(name, name + " IN (" + term.parameters.map(function(param){ 
								params.push(param);
								return "?";
							}).join(",") + ")");
						}
					}
					else{
						throw new URIError("Invalid query syntax, " + term.method + " not implemented");
					}
				}
				else{
					throw new URIError("Invalid query syntax, unknown type");
				}
				function addClause(name, sqlClause){
					if(indexedColumns.indexOf(name) == -1){
						throw new URIError("Can only query by " + indexedColumns.join(","));
					}
					if(sql){
						sql += term.logic == "&" ? " AND " : " OR ";
					}
					sql += sqlClause;
				}
			});
			return sql || "1=1";
		},
		
		executeQuery: function(sql, options){
			// executes a query with provide start and end parameters, calculating the total number of rows
			if(options){
				if(typeof options.start === "number"){
					var countSql = sql.replace(/select.*?from/i,"SELECT COUNT(*) as count FROM");
					if(typeof options.end === "number"){
						sql += " LIMIT " + (options.end - options.start + 1);
					}
					sql += " OFFSET " + options.start;
					var results = this.executeSql(sql, options.parameters).rows;
					var lengthObject = first(this.executeSql(countSql, options.parameters).rows);
					
					results.totalCount = lengthObject.count;
					return results; 
				}
			}
			var results = this.executeSql(sql, options.parameters).rows;
			results.totalCount = results.length;
			return results; 			
		},
		getSchema: function(){
			if(config.type == "mysql"){
				store.startTransaction();
				var results = store.executeSql("DESCRIBE " + config.table, {});
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
		},
		executeSql: function(sql, parameters){
			return database.currentTransaction.executeSql(sql, parameters);
		}
	};
	for(var i in config){
		store[i] = config[i];
	}
	return AutoTransaction(store, database);
}


try{
	var DATABASE = require("settings").database;
}catch(e){
	print("No settings file defined");
}

var defaultDatabase;
exports.defaultDatabase = function(parameters){
	parameters = parameters || {};
	for(var i in DATABASE){
		if(!(i in parameters)){
			parameters[i] = DATABASE[i];
		}
	}
	
	if(defaultDatabase){
		return defaultDatabase;
	}
	defaultDatabase = SQLDatabase(parameters);
	require("stores").registerDatabase(defaultDatabase);
	return defaultDatabase;
};
exports.openDatabase = function(name){
	throw new Error("not implemented yet"); 	
};
