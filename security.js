/**
 * Provides the default mechanism for Pintura's security system.
 */

var AccessError = require("perstore/errors").AccessError,
	first = require("promised-io/lazy-array").first,
	when = require("promised-io/promise").when,
	getCurrentSession = require("./jsgi/session").getCurrentSession,
	Restrictive = require("perstore/facet").Restrictive,
	sha1 = require("./util/sha1").b64_sha1,
	settings = require("perstore/util/settings"),
	modelModule = require("perstore/model");

try{
	var uuid = require("uuid");
}catch(e){

}
exports.userSchema = {
};

exports.DefaultSecurity = function(){
	// allow JSON-RPC authentication
	var Class = require("perstore/model").classModel;

	function authenticate(username, password, expires){
		try{
			return username ? when(security.authenticate(username, password),
				function (user){
					var session = getCurrentSession(true, expires);
					if (session && user) {
						session.user = user.id;
						session.save();
					}
					return user;
				}, onError) : onError();
		}catch(e){
			onError(e);
		}
		// N.B. we use errBack in when() --> any exception will result in silent logout!!!
		function onError(e){
			var session = getCurrentSession();
			if(session && session.user){
				delete session.user;
				session.save();
			}
			if (e) throw e;
		}
	}

	var userModel;
	var admins = settings.security && settings.security.admins;
	var groupToModels = {};
	var security = {
		// authentication methods:
		encryptPassword: function(username, password){
			return password && sha1(password);
		},
		authenticate: function(username, password){
			if(typeof this.encryptPassword === 'function'){
				password = this.encryptPassword(username, password);
			}
			return when(security.getUserModel().get(username), function(user){
				if(!user || (user.password !== password)){
					// allow admins to authenticate					
					if (!admins || !(user=admins[username]) || user.password !== password)
						throw new AccessError("No user with the provided password");
					user.id = username;
				}
				return user;
			});
		},
		createUser: function(username, password){
			if(typeof this.encryptPassword === 'function'){
				password = this.encryptPassword(username, password);
			}
			return when(security.getUserModel().get(username), function(user){
				// N.B. disallow overwrite admins
				var admins = settings.security.admins;
				if(user || (admins && admins[username]))
					throw new AccessError("User already exists");
				return security.getUserModel().add({
						password: password
					}, {id: username, overwrite: false});
			});
		},
		getUserModel: function(){
			if(!userModel){
				var Model = require("perstore/model").Model;
				userModel = Model(exports.userSchema);
				userModel.setPath("User");
			}
			return userModel;
		},
		getAuthenticationFacet: function(){
			return Restrictive(security.getUserModel(), {
				query: function(){
					throw new AccessError("Can not query user objects");
				},
				get: function(){
					throw new AccessError("Can not view user objects");
				},
				post: function(body){
					var username = body.user;
					var password = body.password;
					switch(body.method){
						case "authenticate":
							return authenticate(username, password, body.expires);
						case "createUser":
							return security.createUser(username, password);
						default:
							throw new Error("unknown method " + body.method);
					}
				}
			});
		},
		setUserModel: function(value){
			userModel = value;
		},

		// access methods:
		groupsUsers: {
			user: ['*'],
			public: [null]
		},
		getGroupsForUser: function(user){
			var groupsUsers = this.groupsUsers;
			var groupsForUser = [];
			// at some point we may want to convert this to an array for faster access
			for(var groupName in groupsUsers){
				var users = groupsUsers[groupName];
				if(users.indexOf(user) > - 1 || users.indexOf('*') > - 1){
					// the user is in this group
					groupsForUser.push(groupName);
				}
			}
			return groupsForUser;
		},
		modelForUsers: {},
		getModelForUser: function(user){
			if(this.modelForUsers[user]){
				// check the cache
				return this.modelForUsers[user];
			}
			var groups = this.getGroupsForUser(user).concat(['_default']);
			var model = {};
			groups.forEach(function(group){
				var groupModel = groupToModels[group];
				for(var key in groupModel){
					if(!model[key] || !(model[key].quality > groupModel[key])){
						model[key] = groupModel[key];
					}
				}
			});

			this.modelForUsers[user] = model;
			modelModule.initializeRoot(model);
			return model;
		},
		registerModels: function(){
			var groups;
			processItem([].slice.call(arguments));
			function processItem(item, key){
				if(item instanceof Array){
					// process each item in an array
					item.forEach(function(item){
						processItem(item, key);
					});
				}else if(item && item.groups && typeof item === 'object'){
					// define the groups and recurse
					groups = item.groups;
					if(item.model){
						if(typeof item.model !== 'function'){
							throw new Error('Model in ' + key + ' does not appear to be a valid model constructor' + item.model);
						}
					}else if(!item.models){
						throw new Error('No valid model provided for ' + key + ' with groups ' + groups);
					}
					processItem(item.models || item.model, key);
					groups = null;
				}else if(typeof item === 'function'){
					// a model itself, add the definition
					if(!key){
						throw new Error('No key defined for model');
					}
					(groups || item.groups || ['_default']).forEach(function(group){
						(groupToModels[group] || (groupToModels[group] = {}))[key] = item;
					});
				}else if(item && typeof item === 'object'){
					// an object hash, process each as a key
					for(key in item){
						processItem(item[key], key);
					}
				}else{
					throw new Error('An invalid value encountered in model registration ' + item + ' for groups ' + groups + ' for name ' + key);
				}
			}
		}
	};
	exports.userSchema.authenticate = authenticate;

	return security;
};



var Facet = require("perstore/facet").Facet,
	Restrictive = require("perstore/facet").Restrictive;

var FullAccess = exports.FullAccess = Facet(Object, function(store){
	var storeFullAccess = Facet(store, store);
	storeFullAccess.forStore = function(requestedStore){
		return store;
	}
	storeFullAccess.quality = 1;
	return storeFullAccess;
});
FullAccess.forStore = function(store){
	return store;
}
FullAccess.quality = 1;



var ReadOnly = Restrictive(Object, {
/**	appliesTo: Object,
	allowed: function(object, env){
		return true;//env.remoteUser.name == "admin";
	},
/*	load: function(object, source){
		return object;
	},
	update: function(object, source){
		return source;
	},* /

var ReadOnly = new SchemaFacet(Object, {
	additionalProperties:{
		readonly: true
	},*/
	quality: 0.1
});
exports.ReadOnly = ReadOnly;
