var configure = require('../../jsgi/configure'),
	assert = require('assert');
	

exports.testConfigure = function(){
	var topCalled;
	var configuredApp = configure([
		'./xsite',
		{module: './pintura-headers', config: 'test'},
		{factory: function test(nextApp){
			return function(request){
				topCalled = true;
				return {headers: {}};
			};
		}}
	]);
	var request = {
		queryString: '',
		headers: {}
	};
	var appArray = configuredApp.asArray();
	assert.equal(appArray.length, 3);
	assert.equal(typeof appArray[0].app, 'function');
	assert.equal(appArray[0].module, './xsite');
	assert.equal(typeof appArray[1].app, 'function');
	assert.equal(typeof appArray[2].app, 'function');
	configuredApp(request);
	assert.equal(topCalled, true);
	assert.equal(configuredApp.get('xsite').module, './xsite');
	configuredApp.delete('xsite');
	appArray = configuredApp.asArray();
	assert.equal(appArray.length, 2);
	configuredApp.unshift('./head');
	appArray = configuredApp.asArray();
	assert.equal(appArray.length, 3);
	topCalled = false;
	configuredApp(request);
	assert.equal(topCalled, true);
	configuredApp.delete('test');
	topCalled = false;
	try{
		configuredApp(request);
	}catch(e){
		// this will error because there is no handler
	}
	assert.equal(topCalled, false);
};

if (require.main === module)
    require('patr/runner').run(exports);