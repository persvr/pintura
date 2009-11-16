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

var QueryRegExp = require("../json-query").QueryRegExp;
exports.JsonQueryToSQLWhere = function(tableName, indexedColumns){
	return function(query, options){
		var matches;
		if((matches = query.match(QueryRegExp(/^(\[?\?(\(?$prop$comparator$value(&|\|)?)+\)?\]?)?\??(\[[\/\\]$prop\])?$/)))){
			var sql = " ";
			if(matches[1]){
				var unconsumed = matches[1].replace(QueryRegExp(/\[?\??$prop$comparator$value(&|\|)?/g), function(t, prop, comparator, value, operator){
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
	}
};

exports.nameValueToSQL = function(query, options){
};