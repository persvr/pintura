/**
 * Provides the default mechanism for Pintura's security system.
 */
exports.DefaultSecurity = function(UserClass){
	return {
		authenticate: function(username, password){
			var user = UserClass.query("username=$1", username)[0];
			if(user.password != password){
				throw AccessError();
			}
				
		},
		createUser: function(username, password){
			
		},
		belongsToRole: function(user, role){
			
		}
	}
};