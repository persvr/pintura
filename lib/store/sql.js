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
	store.get = function(id){
		return store.executeSql("SELECT * FROM " + parameters.table + " WHERE " + parameters.idColumn + "=?", {parameters:[id]}).rows.first();
	};
/*	store.put = function(object, id){
		id = id || object[parameters.idColumn];
		if(id !== undefined){
			if(!this.get(id)){
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
	};*/
		
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
var parseQuery = require("../url-object-query").parseQuery;
exports.JsonQueryToSQLWhere = function(tableName, indexedColumns){
	return function(query, options){
		if(typeof query === "string"){
			query = parseQuery(query);
		}
		var sql = "";
		query.children.forEach(function(child){
			if(child.type == "comparison"){
				if(indexedColumns.indexOf(child.name) == -1){
					throw new URIError("Can only query by " + indexedColumns.join(","));
				}
				if(!options){
					throw new Error("Values must be set as parameters on the options argument, which was not provided");
				}
				if(sql){
					sql += query.logic == "&" ? " AND " : " OR ";
				}
				(options.parameters = options.parameters || []).push(child.value);
				sql += child.name + child.comparator + "?";
				
			}
			else if(child.type == "call"){
				if(child.method == "sort"){
					if(!sql){
						sql += "1=1";
					}
					var sortAttribute = child.children[0];
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
				else{
					throw new URIError("Invalid JSON Query syntax, " + child.method + " not implemented");
				}
			}
			else{
				throw new URIError("Invalid JSON Query syntax, unknown type");
			}
		});
		return sql || "1=1";
	}
	
	/*
			var sql = " ";
			if(matches[1]){
				if(query.replace(/([\w%\._]+)([-=+!])([\w%\._]+)/g), function(t, prop, comparator, value, operator){
					if(indexedColumns.indexOf(prop) == -1){
						throw new URIError("Can only query by " + indexedColumns.join(","));
					}
					if(!options){
						throw new Error("Values must be set as parameters on the options argument, which was not provided");
					}
					(options.parameters = options.parameters || []).push(eval(value.toString()));
					sql += prop + "=? ";
					switch(operator){
						case "&" : 
							sql += " AND ";
							break;
						case "|" : 
							sql += " OR ";
							break;
					}
					return "";
				});
				if(unconsumed){
					throw new URIError("Invalid JSON Query syntax");
				}
			}
			else{
				sql += "1=1 ";
			}
			if(matches[8]){
				if(indexedColumns.indexOf(matches[8]) == -1){
					throw new URIError("Can only sort by " + indexedColumns.join(","));
				} 
				sql += " ORDER BY " + matches[8] + " " + (matches[7].charAt(1) == '/' ? "ASC" : "DESC");
			}
			return sql;
		}
	}*/
};

exports.nameValueToSQL = function(query, options){
};