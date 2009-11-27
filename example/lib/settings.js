exports.DATABASE = {
	connection:"jdbc:mysql://localhost/prototype?user=root&password=&useUnicode=true&characterEncoding=utf-8&autoReconnect=true",
	type: "mysql"
};

exports.MAIL = {
	host:"mail.site.com",
	defaultFrom: "app@site.com"
}; 

exports.BYPASS_SECURITY= true;

exports.DATA_FOLDER = "data"; // data directory in current directory is the default
