var Media = require("media").Media,
    escapeHTML = require("html").escapeHTML

Media({
    mediaType:"text/html",
    getQuality: function(object) {
        return 0.9
    },
    serialize: function(object, request, response) {
        return {
            forEach: function(write) {
                var title = request.store.title || request.scriptName.substring(1);
                var qs = "?" + request.queryString;
                write('<html><head>\n');
                write('<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>\n');
                write('<script type="text/javascript" src="/hatom-bottomless.js"></script>\n');
                write('<title>' + title + '</title></head>\n');
                write('<link rel="alternate" type="application/atom+xml"'); 
                write(' title="Atom Feed" href="' + qs + '&http-accept=application/atom+xml"/>\n');
                write('<body>\n');
                write('<div class="hfeed">\n')
                write('<h1 class="feed-title">' + title + '</h1>\n');
                if (request.store.description) {
                    write('<h2 class="feed-subtitle">' + request.store.description + '</h2>\n');
                }
                if (typeof object.forEach === "function") {
                    var range = require("jsgi/parse-header")["content-range"](response.headers["content-range"], 25);
                    if (range.prev) {
                        var prevRange = [range.prev.start, range.prev.end].join("-");
                        write('<div id="prevLink"><a rel="prev" href="' + qs + '&http-range=items%3d' + prevRange + '">Previous</a></div>')
                    }
                    object.forEach(writeEntry);
                    if (range.next) {
                        var nextRange = [range.next.start, range.next.end].join("-");
                        write('<div id="nextLink"><a rel="next" href="' + qs + '&http-range=items%3d' + nextRange + '">Next</a></div>')
                    }
                }
                else{
                    writeEntry(object);
                    if (typeof object.getContent === "function") write(object.getContent());
                }
                function writeEntry(item){
                    var updated;
                    if (typeof item.getUpdated === "function") {
                        // TODO is this even necessary? can't we just use last-modified?
                        updated = item.getUpdated();
                    }
                    else if (typeof item.getMetadata === "function" && item.getMetadata()["last-modified"]) {
                        updated = item.getMetadata()["last-modified"];
                    }
                    
                    write('<div class="hentry">\n');
                    write('  <a rel="bookmark" href="' + (item.getId ? item.getId() : item.id) + '"><h3 class="entry-title">' + item.getTitle() + '</h3></a>\n');
                    if (updated && updated.toISOString){
                        write('  Updated: <abbr class="published" title="' + updated.toISOString() + '">' + [updated.getMonth() + 1, updated.getDate(), updated.getFullYear()].join("/") + '</abbr>\n');
                    }
                    write('  <div class="entry-summary">' + item.getSummary() + '</div>\n');
                    write('</div>\n');
                }
                
                
                write('</div>\n');
                write('</body></html>');
            }
        };
    }
});
