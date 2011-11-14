/**
 * Provides parsers for various HTTP headers
 */

exports["content-range"] = function(contentRange, pageSize) {
    if (!contentRange) return;
    var parts = contentRange.match(/(\d+)\-(\d+)\/(\d+)/);
    if (!parts) return;
    var r = {};
    r.start = parseInt(parts[1], 10);
    r.end = parseInt(parts[2], 10);
    r.total = parseInt(parts[3], 10);
    
    if (!pageSize) return r;
    if (r.start) {
        r.prev = {};
        r.prev.start = r.start - pageSize;
        if (r.prev.start < 0) r.prev.start = 0;
        r.prev.end = r.start - 1;
    }
    if (r.total - r.end > 1) {
        r.next = {};
        r.next.start = r.end + 1;
        r.next.end = r.end + pageSize;
        if (r.next.end >= r.total) r.next.end = r.total - 1;
    }
    return r;
};