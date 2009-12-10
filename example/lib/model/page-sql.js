/**
 * This provides the definition of the SQL store if used
 */

var SQLStore = require("store/sql").SQLStore;

exports.pageStore = SQLStore({
	table: "Page",
	starterStatements: [
		"CREATE TABLE Page (id INT NOT NULL AUTO_INCREMENT, title VARCHAR(100), status VARCHAR(10), content VARCHAR(100000), PRIMARY KEY(id))",
		],
	idColumn: "id"
});
