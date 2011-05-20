[Pintura](http://www.google.com/maps?f=q&source=s_q&hl=en&geocode=&q=pintura&sll=40.554798,-111.881839&sspn=0.009211,0.016351&ie=UTF8&hq=&hnear=Pintura,+Washington,+Utah&ll=37.31666,-113.171539&spn=0.308538,0.523224&t=p&z=11)
is a cross-platform server side JavaScript based REST architecture web framework 
using standards based HTTP client/server interaction with a focus on JSON formatted data. 
Pintura gives you out of the box RESTful HTTP/JSON interface to data, you can simply
create data models and Pintura automatically provides an HTTP interface. Pintura consists of reusable 
[CommonJS](http://wiki.commonjs.org/) modules and 
[JSGI](http://jackjs.org/jsgi-spec.html) middleware such that it can be used on any 
JSGI compliant JavaScript platform, but is tested on Node.js and Jack 0.3. Pintura 
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

One of the easiest way to get started with Pintura is start with the 
[Persevere example app](http://github.com/kriszyp/persevere-example-wiki),
which can be downloaded and started with [Nodules](http://github.com/kriszyp/nodules).
It is recommended that you install Pintura such that it is available in require statements
under the "pintura" path. This can easily be done with a package mapping compliant module
loader like [Nodules](http://github.com/kriszyp/nodules) by using a mapping in your 
package.json (and then Pintura will be automatically downloaded for you):

    "mappings": {
	    "pintura": "jar:http://github.com/kriszyp/pintura/zipball/master!/lib/"
    }

You can then use "app" property from require("pintura/pintura") as a JSGI application. 
With [jsgi-node](http://github.com/kriszyp/jsgi-node) you can start Pintura:

    require("jsgi-node").start(require("pintura/pintura").app); 

Or with Jack:

    exports.app = require("pintura/pintura").app;
    
You can see a more in-depth example of serving static files in combination with Pintura
in the Persevere example app [startup file](http://github.com/kriszyp/persevere-example-wiki/blob/master/lib/index.js).
 
Using Pintura
===========

Persevere applications are generally built upon models, which act as classes for data.
[Perstore](http://github.com/kriszyp/perstore) is the persistence library that is used 
by Persevere for defining models. Models defined with Perstore are automatically
made accessible through HTTP by Pintura. A simple example of a model is:

    var Model = require("perstore/model").Model,
    	store = require("perstore/mongodb").MongoDB("Product");
    Product = Model("Product",store, {
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
[query parsing capabilities](http://github.com/kriszyp/perstore) and stores implement 
query execution (dependent on the capabilities of the DB).
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
that can be overriden are:

* authenticate(username, password) -  The authenticate method
allows you to define a custom authentication method and defaults to authenticating
against the auto-generated User model. Should return a user object.
* getAllowedFacets(user, request) - Allows you to define which facets are available
for a given user. This should return an array of facets. By default this grants 
full access to everything (the require("pintura/security").FullAccess facet) for all users.
* createUser(username, password) - This should create a new user for with the given
credentials.
* getUsername(user) - Should return the name of the given user.
* {g|s}etUserClass - Retrieve or set the user class used to find users
* {g|s}etAuthClass - Retrieve or set the authentication class used to find authentication tokens

Error Handling
===========

Pintura includes middleware for catching errors and converting them to appropriate
HTTP error status codes. The following uncaught errors (until the error middleware catches them)
are translated:

* URIError - 400
* TypeError - 403
* require("perstore/errors").NotFoundError - 404
* require("perstore/errors").PreconditionFailed - 412
* require("perstore/errors").AccessError - if user is authenticated 403, if not 401
* require("perstore/errors").MethodNotAllowedError - 405
* RangeError - 416
* Other errors - 500 or if the error object has a "status" property, that will be used

Content Negotiation
===============

One of the core concepts of the REST architecture is content negotiation which permits
multiple views or representations of resources or objects. Providing content negotiation
is a key functionality that Pintura provides. Pintura utilizes a set of media type handlers
to find the best representation for serializing (or deserializing) data. Pintura comes
with several media type handlers including:
 
* json – JSON media handler
* javascript – Similar to the JSON media handler, but will serialize to additional JavaScript specific types such as dates, NaN, functions, and other types that do not exist in JSON.
* multipart-form-data and url-encoded – Used for parsing form data.
* csv - Comma separated values
* atom - Atom based view
* html - A very simple HTML view of data.

To request a JSON view of data, include an Accept header in your HTTP request:

    Accept: application/json

Accept headers can include multiple options and quality values. By default application/javascript
is considered the highest quality represention by Pintura (it is basically the same as JSON
but also can include date literals and special numeric types like NaN and Infinite).

Creating new media types is common way to extend Pintura with additional formats.
To create a new media type handler, use the Media constructor from the "media" module.
This constructor takes an object argument with four properties:

* mediaType - The name of the media type.
* quality - A numeric value indicating the quality of the media type (generally a number from 0 - 1).
* serialize - A function that is called to serialize the data (JavaScript objects or arrays) to string output for the response.
* deserialize - A function that is called to deserialize the request input data to JavaScript objects or arrays.


Paging/Range Requests
-------------------

Pintura can handle requests for "pages" of data, query results with start and ending
index limits, through Range headers. To request items 10 through 19 of a query,
include a Range header:

    GET /Product/?type=shoe
    Range: items=10-19

The server will return a Content-Range header indicating the range returned and total
count of the results. 

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
-----

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
     
Cross-Site Request Forgery Protection
==========================

Pintura provides CSRF protection to safeguard against malicious attempts to change
data from other websites. This protection means that requests must prove that they
are from your (same-origin) page and are therefore authorized requests. XHR requests
can be validated by including a Client-Id header (with any value) to prove that the request
was generated through XHR. Non-XHR requests (such as form-based requests) can prove
their same-origin validation by including the cookie value from the "pintura-session" in
a "pintura-session" query parameter.

If a request is not provably same-origin, the request object will include a "crossSiteForgeable"
property value of true to indicate that it should be regarded with suspicion.
 
JSON-RPC
========
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

### Homepage:

* [http://persvr.org/](http://persvr.org/)

### Source & Download:

* [http://github.com/kriszyp/pintura/](http://github.com/kriszyp/pintura)

### Mailing list:

* [http://groups.google.com/group/persevere-framework](http://groups.google.com/group/persevere-framework)

### IRC:

* [\#persevere on irc.freenode.net](http://webchat.freenode.net/?channels=persevere)

Pintura is part of the Persevere project, and therefore is licensed under the
AFL or BSD license. The Persevere project is administered under the Dojo foundation,
and all contributions require a Dojo CLA.