[Pintura](http://www.google.com/maps?f=q&source=s_q&hl=en&geocode=&q=pintura&sll=40.554798,-111.881839&sspn=0.009211,0.016351&ie=UTF8&hq=&hnear=Pintura,+Washington,+Utah&ll=37.31666,-113.171539&spn=0.308538,0.523224&t=p&z=11)
is a cross-platform server side JavaScript based REST architecture web framework 
using standards based HTTP client/server interaction with a focus on JSON formatted data. 
Pintura gives you out of the box RESTful HTTP/JSON interface to data, you can simply
create data models and Pintura automatically provides an HTTP interface. Pintura consists of reusable 
[CommonJS](http://wiki.commonjs.org/) modules and 
[JSGI](http://wiki.commonjs.org/wiki/JSGI/Level0/A/Draft2) middleware such that it can be used on any 
JSGI compliant JavaScript platform, but is tested on NodeJS and RingoJS. Pintura 
forms the core of the [Persevere](http://www.persvr.org/) 2.0 framework which is 
designed for rich Internet applications that rely heavily on Ajax-driven data 
communication from the browser. To learn more about features, capabilities, and philosophy of
Pintura see the [introduction to Pintura](http://www.sitepen.com/blog/2010/01/22/introducing-pintura/).
The [getting started with Pintura](http://www.sitepen.com/blog/2010/01/25/getting-started-with-pintura/) 
article provides a great starting point for using Pintura to build Persevere applications.
Pintura is primarily composed of JSGI middleware components, and these components
are [described here](http://www.sitepen.com/blog/2010/03/04/pintura-jsgi-modules/).

Setup Pintura
=================

Pintura can be installed with NPM via:

	npm install pintura

However, one of the easiest way to get started with Pintura is start with the 
[Persevere example app](http://github.com/persvr/persevere-example-wiki),
which can be installed with:

	npm install persevere-example-wiki

Pintura can be installed in RingoJS likewise:

	ringo-admin install persvr/pintura

See the [Persevere installation instructions for more information](http://persvr.org/Page/Installation).

You can then use "app" property from require("pintura/pintura") as a JSGI application. 
With [jsgi-node](http://github.com/persvr/jsgi-node) you can start Pintura:

    require("jsgi-node").start(require("pintura/pintura").app); 
    
Pintura requires a local.json file to be present in the current working directory.
An example of this file can be found [here](https://github.com/persvr/persevere-example-wiki/blob/master/local.json).
At a minimum Pintura also requires an implementation of the require("pintura/pintura").getDataModel
function to provide the data model that drives the HTTP REST interface.

You can see a more in-depth example of serving static files in combination with Pintura
in the Persevere example app [startup file](http://github.com/persvr/persevere-example-wiki/blob/master/lib/index.js).
 
Using Pintura
===========

Persevere applications are generally built upon models, which act as classes for data.
[Perstore](http://github.com/persvr/perstore) is the persistence library that is used 
by Persevere for defining models. Models defined with Perstore are automatically
made accessible through HTTP by Pintura. The goal of Pintura is that your application
will primarily consist of model design and Pintura will handle the most of the mechanics
of exposing that model through an HTTP/REST API. A simple example of a model is:

    var Model = require("perstore/model").Model,
    	store = require("perstore/mongodb").MongoDB("Product");
    Product = Model(store, {
        properties: {
            name: String
            // we can define other properties, all 
        },
        // we can define handlers
        put: function(object, directives){
            object.updated = new Date();
            store.put(object, directives);
        }
    }); 

We can then expose this data model through Pintura's HTTP REST interface by implementing 
the getDataModel function on the pintura module. This function is called for each HTTP
request:

	require("pintura/pintura").getDataModel = function(request){
		return {
			Product: Product
		};
	};

Our data model will then be available at the path of /Product/ such that we can make
HTTP requests like GET /Product/2.

HTTP/REST Basics
----------------

With Persevere we can automatically interact with this data model through standard
HTTP requests:

* GET /{model}/{id} - Gets the object with the given id from the model store.
* PUT /{model}/{id} - Updates or creates object with the given id in the model store.
* DELETE /{model}/{id} - Deletes the object with the given id from the model store.
* POST /{model}/ - Creates or incrementally updates an object in model store.

Pintura converts HTTP requests to method calls on the model. When an HTTP request
is received it is converted to a call to the model of the form:

    {model}.{httpMethod}({id or body},metadata);

For example if a request is received:

    GET /Product/33 

This will result in a call to the model like:

    Product.get("33", metadata); 

For the model above, there is no "get" method defined, so the default "get" handler
would be used, which delegates to the store to get the object by id. If we made a
request like:

    PUT /Product/33 

This would call the "put" handler defined in the model above.
One can also query stores through HTTP. Requests of the form /{model}/?{query}
are passed through to the model by calls to the "query" method on the model.
Perstore provides 
[query parsing capabilities](http://github.com/persvr/perstore) and stores implement 
query execution (dependent on the capabilities of the DB), based on [RQL](http://github.com/persvr/rql).
An example of a query:

    GET /Product/?type=shoe&price=lt=20&sort(-rating)

Security
========

Persevere's facet-based security model forms the foundation of access control and
is [described in this article](http://www.sitepen.com/blog/2010/03/08/object-capability-model-and-facets-in-perstorepintura/).
Facets are used to define the different levels of access for models. Pintura's security
configuration object can then be configured to define how users are authenticated
and which facets or access levels each user is given. The security configuration object
is available at require("pintura/pintura").config.security. The primary functions
that can be overriden or used are:

* authenticate(username, password) -  The authenticate method
allows you to define a custom authentication method and defaults to authenticating
against the auto-generated User model. Should return a user object.
* createUser(username, password) - This should create a new user for with the given
credentials.
* getUsername(user) - Should return the name of the given user.
* {g|s}etUserClass - Retrieve or set the user class used to find users
* {g|s}etAuthClass - Retrieve or set the authentication class used to find authentication tokens
* encryptPassword(username, password) - By default applies SHA1 hashing to the password.
* getUserModel()/getAuthenticationFacet() - Allows you to define your own user model
and facet for access to the user model (for unauthenticated users).

For example, we could choose to store passwords in plaintext by changing the
encryptPassword method to a return the password unchanged:

	require("pintura/pintura").config.security.encryptPassword = function(username, password){
		return password;
	};

## Access After Authentication

Once authentication is established, we could then use the user's authentication state to restrict or allow access to different
parts of the application data model. For example, we could check to see if a user is
logged to determine if we should provide access to the "Secret" data: 

	var publicModel = {
		Product: Product
	};
	var authorizedModel = {
		Product: Product,
		Secret: SecretModel
	};
	require("pintura/pintura").getDataModel = function(request){
		var user = request.remoteUser;
		if(user){
			return authorizedModel;
		}
		return publicModel;
	};

We could also potentially have a data model that is readonly for some users and 
editable for others. In the example above, we could specify that the Product table
is readonly for users that are not logged in:

	var Restrictive = require("perstore/facet").Restrictive;
	var publicModel = {
		// the Product table is restricted to readonly for public access 
		Product: Restrictive(Product)
	};
	var authorizedModel = {
		// the Product table is unrestricted here for authorized users 
		Product: Product,
		Secret: SecretModel
	};
	// assign the data model based on authentication as above
	
Error Handling
===========

Pintura includes middleware for catching errors and converting them to appropriate
HTTP error status codes. This makes it easy for application code to throw an error
and have it automatically propagate to an appropriate HTTP failure response.
The following uncaught errors (until the error middleware catches them)
are translated:

* URIError - 400
* TypeError - 403
* require("perstore/errors").NotFoundError - 404
* require("perstore/errors").PreconditionFailed - 412
* require("perstore/errors").AccessError - if user is authenticated 403, if not 401
* require("perstore/errors").MethodNotAllowedError - 405
* RangeError - 416
* Other errors - 500 or if the error object has a "status" property, that will be used

For example, if we had a model definition, we could throw a TypeError if the date
property on PUT requests is not a valid date. This will result in a 403 response from the server
to the client for PUT requests that violate this condition:

	Purchase = Model(store, {
	    // we can define handlers
	    put: function(object, directives){
	    	if(isNaN(new Date(object.date).getTime())){
	    		throw new TypeError("Invalid date");
	    	}
	    	...
	    }
	}); 

Content Negotiation
===============

One of the core concepts of the REST architecture is content negotiation which permits
multiple views or representations of resources or objects. Providing content negotiation
is a key functionality that Pintura provides. Pintura utilizes a set of media type handlers
to find the best representation for serializing (or deserializing) data. Pintura comes
with several media type handlers (found in pintura/media/) including JSON, JavaScript,
multipart form-data, HTML, Atom, and others.

To request a JSON view of data, include an Accept header in your HTTP request:

    Accept: application/json

Accept headers can include multiple options and quality values. By default application/javascript
is considered the highest quality represention by Pintura (it is basically the same as JSON
but also can include date literals and special numeric types like NaN and Infinite).

## media (folder)

This folder contains modules that implement various media types. These media
types can deserialize raw content to objects and serialize objects to raw content. These
media types are registered by pintura module. Below are the media type modules,
their name and default quality. The quality is a number between 0 - 1 that determines
it's preference. The content type is selected by choosing the media with the highest product of the 
requested quality setting (from the Accept header) and the server's quality setting (defined by the media module).

* media/javascript - application/javascript, q=0.9: This represents utilizing JavaScript constructs
like native Date objects, NaN, Infinite, etc. to extend JSON
* media/json - application/json, q=0.8: JSON representation of objects
* media/plain - text/plain, q=0.1
* media/uri-list - text/uri-list, q=0.05: Represents arrays as a plain text list, one item per line
* media/url-encoded - application/x-www-form-urlencoded, q=0.1: This is default encoding
of forms in web pages, and is useful for decoding form data sent from form submissions
* media/csv - text/csv, q=0.2: Comma seperated values representation 
* media/atom+xml - application/atom+xml, q=0.5: Atom feed representation of data
* media/html - text/html, q=0.1: A simple default representation of data as HTML. If 
you are planning on rendering objects as HTML, you will probably want to register your
own HTML media type handler. This handler only serializes.
* media/multipart-form-data - multipart/form-data, q=0.2: Deserializes form data
submitted with multipart/form-data as the content type. This media type is important
for handling forms with file uploads
* media/message/json - message/json, q=0.75: This is a representation of messages
in JSON format. This can be used for triggering a series of actions in a single request.
This is described in more detail above in the Bulk Updates section.

## media (module)

This module is responsible for handling content negotiation, determining the appropriate
media deserialization or renderer for a given content type or requested content type, by
choosing the media type with the highest calculated quality setting for the negotiation.

Creating new media types is a common way to extend Pintura with additional formats.
This module provides a constructor for creating new media handlers that will be registered
for the content negotiation process. To create a new media type handler, use the Media constructor.
This constructor takes an object argument with four properties:

* mediaType - The name of the media type.
* getQuality(object) - A function that returns a numeric value indicating the quality of the media type (generally a number from 0 - 1).
* serialize(object, parameters, request, response) - A function that is called to serialize the data (JavaScript objects or arrays) to string output for the response.
* deserialize(inputStream, request) - A function that is called to deserialize the request input data to JavaScript objects or arrays.

Make sure you include your media module in your top level app module so it is executed.

Paging/Range Requests
-------------------

Pintura can handle requests for "pages" of data, providing query results with start and ending
index limits, through Range headers. To request items 10 through 19 of a query,
include a Range header:

    GET /Product/?type=shoe
    Range: items=10-19

The server will return a Content-Range header indicating the range returned and total
count of the results:

	HTTP/1.1 206 Partial Content
	Content-Range: items 10-19/122

Bulk Updates and Comet
================

Pintura utilizes the message/* category of media types for indicating a set of requests 
or messages. Normally each HTTP request triggers one action in the store in its own
transaction, but a 
request with a content type of message/sub-type (usually message/json or message/javascript)
will be treated as a set of requests
that are all processed within one transaction. This allows you to do several updates
with one HTTP request. For request with a set of messages, the body should be an
array of objects, where each object can have the following properties (only "method" is required):

* to - The id/path of the target object of the action. This is resolved relative to the path of the request URI.
* method - The method to execute, can be "get", "put", "post", "subscribe", or any other method on the target store.
* body - The body of the request; the main payload of data.
* queryString - query string
* id - A message id, any subsequent message with the same id should be ignored (allows for idempotent messages) 
* metadata - Any metadata needed for the request

For example, updating two objects could be done:

    POST /Product/
    Content-Type: message/json 
    Accept: message/json
    
    [
      {to:"2", method:"put", body:{name:"updated 2"}, id: 1},
      {to:"3", method:"put", body:{name:"updated 3"}, id: 2}
    ]
    
The message/* media type can also be used in Accept headers to indicate that a response
with a set of messages should be returned. This should be used for bulk updates. A
response will be an array of objects where each object may have the following properties:

* from - The id/path of the object that was acted on 
* body - The body of the response
* id - The id of the message that this message is in response to
* type - The type of the action that was executed

An example response (for the requests above):

    Content-Type: message/json
    
    [
      {"from":"2", "body":{"name":"updated 2"}, "id": 1},
      {"from":"3", "body":{"name":"updated 3"}, "id": 2}
    ]

Real-Time/Comet
-------------

The message/* media type can also be useful for real-time notification of events, AKA
comet. Stores and models that support notifications can return observable objects, typically
through the "subscribe" method, to indicate that multiple events may be emitted that
can later be delivered to the client. When message requests are observable instead of
direct value, responses will not be sent to the client until there is a message ready to be sent.
For example, to subscribe to all events that take place on /User/john:

    POST /User/
    Content-Type: message/json
    Client-Id: 251ab4ac9312f
    Accept: message/json
    
    [
      {to:"john", method:"subscribe"}
    ]

The response to the client will be delayed until an event/message for /User/john occurs.

For maximum browser compatibility, typically long-polling is used for comet applications.
However, there is always a time gap between responses and the next request from the
browser. Consequently for continuous gap-free subscriptions, it can be highly useful
to emulate a continuous connection or queue for messages. This can be done by 
including a Client-Id header. Clients can generate a random id, and repeated connect
using the same client id. Between requests, any events (from subscriptions) will be
pushed into a queue for the given client id until the next request.

The Client-Id header can be included in standard requests as well, allowing other operations
to add event sources and subscriptions to the current client queue. 

Some browsers support XHR streaming and do not require long-polling repeated reconnections.
If you wish to use streaming, include a Streaming header:

    Streaming: true
    
The response will continue indefinitely, sending new messages as they occur.  

Cross domain support
-------------------

Pintura includes support for cross-domain requests from the browser/JavaScript through
JSONP, window.name, or CORS. To make a request with JSONP, you can do add a callback
parameter

    /Product/33?callback=my_callback

Sessions
========

Pintura provides session management through session middleware. This middleware
adds a getSession(createIfNecessary, expires) method to the request object. There is
also a statically accessible exported function for accessing sessions:

    require("pintura/jsgi/session").getCurrentSession(createIfNecessary, expires)

The session object is a persistent object and therefore the save() method that must 
be called if any changes are made to the session object (that need to be persisted to 
future requests).

It is worth noting that one of the goals of REST applications is to minimize server
management of application state, so session use should be generally be avoided or
kept to a minimum when possible.

# JSON-RPC

Pintura supports JSON-RPC to call methods on objects. One can call a method on a
persisted object by using the URL for the object, and JSON-RPC encoded request entity
that describes the method invocation to make. For example:

    POST /Product/33
    Content-Type: application/json
    Accept: application/json
    
    {
      method:"addNote",
      params:["cool product"],
      id:"call1"
    }

Pintura will then lookup the object with the id of "/Product/33" and call object.addNote("cool product").
The return value or thrown error from the call will be returned in a JSON-RPC response. 


# JSGI

Pintura is composed of a set of JSGI middleware components. JSGI is designed for 
asynchronous web applications, and is well-suited for NodeJS's asynchronous 
architecture. JSGI applications are functions that can be called with a request object as an argument,
and return a response object, or a promise for a response. JSGI middleware generally
refers to a function that takes a JSGI application as an argument and returns a new
JSGI application with adding functionality. For example, we could be create a very simple
JSGI application:

	app = function(request){
		return {
			status: 200,
			headers: {},
			body: ['{"some":"json"}']
		};
	}

Now we could apply middleware to this application to add functionality. For example,
we could add JsonP support (for cross-domain requests) with the xsite middleware:

	newApp = require("pintura/jsgi/xsite").JsonP(app);

The top-level pintura module, by default, applies a set of 16 middleware components to create a JSGI
application providing a robust web framework. An introduction to the Pintura middleware
can be found [here](http://www.sitepen.com/blog/2010/03/04/pintura-jsgi-modules/).
By default you don't need to directly
manipulate these JSGI modules unless you want to customize or alter the middleware
stack. The pintura module provides all these middleware components with a default working 
setup that be immediately used without any knowledge of the middleware components
described below. However, understanding the middleware modules can be important
in understanding the full capabilities of Pintura.

The middleware modules in Pintura 
are found in the "jsgi" folder. Most of these modules directly a function that can be
used as the middleware function, and typically take configuration information as the
first parameter and the next application as the second. Below are the syntax and description of these modules:

## auth

	app = require('pintura/jsgi/auth')(security, nextApp);

The auth module handles HTTP authorization, performing the HTTP request side of user 
authentication and calling the security module to perform the authentication and determine the authorization of
the user. This module will set the "remoteUser" property on the request and the "currentUser"
property on the promise context if a user is authenticated. This module returns
a middleware function that takes a security object as the first argument, and the
next app as the second argument.  

## rest-store

	app = require('pintura/jsgi/rest-store')(config);

This module delegates the HTTP REST requests to the appropriate data model. This
component will call the method on the model corresponding the request method name 
(converted to lowercase), so a PUT request will result in a model.put() call. The model
is determined by the path of the request before the first slash. The first argument provided
to the call will be the path for the requests without a body, and the body for requests
with a body. The second argument is an object with the headers and the path as the "id"
property.

This component will alternately call the query() method if the request is a GET with a 
query string. It will also handle the Range header, converting it to an appropriate limit()
parameter in the query string.

## media

	app = require('pintura/jsgi/media').Serialize(mediaSelector, nextApp);
	app = require('pintura/jsgi/media').Deserialize(mediaSelector, nextApp);

This component processes the HTTP content negotiation headers, calling the pintura/media
module to perform content negotiation. This handles the request body deserialization
and response body serialization. The upstream middleware/apps can expect the request.body
value to be a deserialized object (for example, JSON would be parsed), and can return
an object, array, or other value in the response.body and this middleware component
will serialize it based on the client's preferred media type (defined in the Accept header).
The content negotiation is described in more detail in the Content Negotiation section.

By default the mediaSelector should come from require("./media").Media.optimumMedia.

## csrf

	app = require('pintura/jsgi/csrf')(customHeader, nextApp);

This module provides CSRF protection to safeguard against malicious attempts to change
data from other websites. This protection means that requests must prove that they
are from your (same-origin) page and are therefore authorized requests. XHR requests
can be validated by including a custom header (defaults to header named "x-requested-with", with any header value) to prove that the request
was generated through XHR. Non-XHR requests (such as form-based requests) can prove
their same-origin validation by including the cookie value from the "pintura-session" in
a "pintura-session" query parameter.

If a request is not provably same-origin, the request object will include a "crossSiteForgeable"
property value of true to indicate that it should be regarded with suspicion.

The customHeader argument can be the name of an alternate custom header to test for.

## xsite

	app = require('pintura/jsgi/xsite')(nextApp);
	app = require('pintura/jsgi/xsite').JsonP(nextApp);
	
This module provides support for cross-domain requests, that is, it enables web pages
that originate from other servers to request data from your server. This module
supports three different forms of cross-domain support (each of these is a property:

* JsonP - With JsonP the response is wrapped in a callback function so that the requesting
page can provide a function to be called with the response data. The response will normally
use the Javascript media type.
* CrossSiteXhr - Modern browsers support cross-domain XHR requests if the server
provides the proper authorization headers. This middleware component provides these
headers to enable these XHR requests.
* WindowName - This technique is similar to JsonP, but allows the requesting page
to embed the response in a frame to insulate it from arbitrary code execution, and
is described [here](http://www.sitepen.com/blog/2008/07/22/windowname-transport/).
* CrossSite - This combines support for all three of the mechanisms above. This is the export
of the module.

## http-params

	app = require('pintura/jsgi/http-params')(nextApp);

This module provides a means for emulating HTTP headers and methods using query
parameters. This is usually used in conjunction with the xsite middleware to enable 
further functionality for cross-domain requests. The following query parameters
can be included:

* path?http-&lt;header-name>=&lt;header-value> - The middleware will translate this to having 
a header of the with the specified header name and value. For example, we could emulate
a Accept: application/json with path?http-Accept=application/json
* path?http-method=&lt;method-name> - This will be translated to a request with the 
given HTTP method
* path?http-content=&lt;content> - This will be translated to having the parameter value
as the request body. For example, we could emulate a POST with content: path?http-method=POST&http-content=%7B%22some%22%3A%22json%22%7D

## compress

	app = require('pintura/jsgi/compress')(nextApp);

This module provides gzipping of content. Gzipping can significantly reduce the size
of responses and improve performance. This module requires the installation of the
"compress" package (npm install compress).

## cascade

	app = require('pintura/jsgi/cascade')(apps);

This module provides the ability to progressively try several JSGI applications until
one provides a successful response. For example:

	app = require('pintura/jsgi/cascade')([
		app1, app2, app3
	]);

In this scenario, the request would be first handled by app1. If the response was successful (not a 404),
then the response would go to the client. If the response was a 404, then cascade will
delegate to app2 to handle the request, and so on.

## static

	app = require('pintura/jsgi/static')({
		urls: urls,
		root: root,
		directoryListing
	});

This module provides request handling for static files. The static handler will only match
paths that begin with one of the strings provided in the "urls" array. It will look in the
directory specified by the "root" parameter for a file matching the path. The
directoryListing parameter is a boolean indicating whether or not to show directory
listings.

## error

	app = require('pintura/jsgi/error')(nextApp);

This module provides error handling, catching JavaScript errors and converting them
to corresponding HTTP error responses. These responses are documented above in
the Error Handling section.

## session

	app = require('pintura/jsgi/session').Session({
		model: model
	}, nextApp);

The session component adds support for HTTP sessions that persist across HTTP requests.
Sessions are often used for maintaining user authorization and other application state
information. If the optional "model" parameter is provided, the provided model will be
used to store the sessions for the application. The Sessions section above for more
information on accessing the current session.

## context

	app = require('pintura/jsgi/context')(vars, nextApp);

One of the challenges with working asynchronous code is that there can be times when
you wish for some contextual state information to be preserved across multiple
asynchronous actions, without having to actually pass the state to each function in
the asynchronous chain. A common examples of such contextual state would be tracking
the current transaction, or the currently logged in user. Such state information could be 
stored in a singleton (a module property or a global variable), but with asynchronous
actions being interleaved, this is unsuitable for tracking state across asynchronous continuations
of an action. 

The promised-io package's promise module provides a facility for tracking state across
asynchronous operations. The promise module tracks the "context" global variable,
and whatever value that was in the variable at the time a promise was created
will be restored when that promise is fulfilled (or rejected). The pintura/jsgi/context module adds a context object to the JSGI request object
that is tied to the promise module.

## head

	app = require('pintura/jsgi/head')(nextApp);

This is a very simple middleware module that adds automatic support for HTTP HEAD
requests. This component will convert HEAD requests to a GET request for downstream
applications and then strip the response body from the response.

## cache

	app = require('pintura/jsgi/cache').FetchCache(cache, nextApp);
	app = require('pintura/jsgi/cache').UpdateCache(cache, nextApp);
 
Provides caching of downstream responses JSGI applications.

## redirect

	app = require('pintura/jsgi/redirect')(path);
	
Sends a redirect response to the provided path.

## pintura-headers

	app = require('pintura/jsgi/pintura-headers')(serverName, nextApp);

This middleware adds a Server header and a username header to the HTTP responses.

# Top-Level Modules

Below are the top-level modules that are available in Pintura:

## pintura

This module provides the default stack of Pintura middleware and an interface for 
configuring it. It registers the default set of media types. This module is the main interface
for implementing access to the data model, and provides several important properties:

### app

This is a JSGI application composed of the full stack of middleware that will expose
your data models through RESTful requests. You can use this if you want to resuse the
stack and add more middleware components.

### config

This takes the Pintura configuration object. Properties on this object can be overriden
to customize the behavior. The most important property on this object is the getDataModel,
which has been described above as the means for defining which data models are exposed
through the HTTP interface.

### addConnection(connection)

This function adds a connection to another server for the purposes of clustering. The
connection object should conform to the WebSocket API, and provides a communication
channel for the data to be shared. 

## start-node

This module provides a convenience function for easily starting Pintura on NodeJS 
using the jsgi-node delegator with WebSocket support.

### start(app)

This will start the given app, and route WebSocket requests through the app as well. For example:

	require("pintura/start-node").start(require("pintura/pintura").app);
	
## security

This module is responsible for implementing authentication and authorization. Typically
you would modify the pintura module's config.security object to customize the security.
However, the module also allows you to create new security objects.

### DefaultSecurity()

This is a constructor that creates a new security object.


### Homepage:

* [http://persvr.org/](http://persvr.org/)

### Source & Download:

* [http://github.com/persvr/pintura/](http://github.com/persvr/pintura)

### Mailing list:

* [http://groups.google.com/group/persevere-framework](http://groups.google.com/group/persevere-framework)

### IRC:

* [\#persevere on irc.freenode.net](http://webchat.freenode.net/?channels=persevere)

Pintura is part of the Persevere project, and therefore is licensed under the
AFL or BSD license. The Persevere project is administered under the Dojo foundation,
and all contributions require a Dojo CLA.