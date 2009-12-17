exports.Static = function (filename) {
  var body, headers;
  var content_type = fu.mime.lookupExtension(extname(filename));
  var encoding = (content_type.slice(0,4) === "text" ? "utf8" : "binary");
 
  function loadResponseData(callback) {
    if (body && headers && !DEBUG) {
      callback();
      return;
    }
 
    sys.puts("loading " + filename + "...");
    var promise = process.fs.cat(filename, encoding);
 
    promise.addCallback(function (data) {
      body = data;
      headers = [ [ "Content-Type" , content_type ]
                , [ "Content-Length" , body.length ]
                ];
      if (!DEBUG)
        headers.push(["Cache-Control", "public"]);
       
      sys.puts("static file " + filename + " loaded");
      callback();
    });
 
    promise.addErrback(function () {
      sys.puts("Error loading " + filename);
    });
  }
 
  return function (req, res) {
    loadResponseData(function () {
      res.sendHeader(200, headers);
      res.sendBody(body, encoding);
      res.finish();
    });
  }
};

/*
  sys.debug("requesting: "+docroot+req.uri.path);
  
  
  var file = docroot+req.uri.path;
  posix.stat(file)
    .addCallback(function (stat) {
      // file exists.
      posix.open(file, process.O_RDONLY, 0666)
        .addErrback(err[404](res))
        .addCallback(function (fd) {
          res.sendHeader(200, {
            // would be nice to guess at the content-type from filename or something
            "content-length" : stat.size
          });
          readAndSend(fd);
          function readAndSend (fd) {
            posix.read(fd, 1024, null, "binary")
              .addCallback(function (data, bytesRead) {
                if (bytesRead === 0) res.finish();
                else {
                  res.sendBody(data, "binary");
                  readAndSend(fd);
                }
              });
          }
        });
    })
    .addErrback(err[404](res));
    */