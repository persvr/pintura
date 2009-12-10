/**
* Send emails
* Use like this:
* send({
* 			from: "john@mydomain.com",
* 			recipient: "bill@yourdomain.com",
* 			subject: "hi",
* 			message: "message text"
* 		});
* User should define a settings module that provides a MAIL export with the host
*/
var config = require("settings").mail;
exports.send = function(email){
	var props =  new java.util.Properties();
	props.put("mail.smtp.host", config.host);
	props.put("mail.smtp.port", config.port || 25);
	var session = javax.mail.Session.getDefaultInstance(props);
	var msg = new javax.mail.internet.MimeMessage(session);
	var from = new javax.mail.internet.InternetAddress(email.from || config.defaultFrom);
	msg.setFrom(from);
	var to = new javax.mail.internet.InternetAddress(email.recipient);
	msg.setRecipients(javax.mail.Message.RecipientType.TO, to);
	msg.setSubject(email.subject)
	msg.setText(email.message);
	//session.getTransport().Transport(msg);
	javax.mail.Transport.send(msg);
};