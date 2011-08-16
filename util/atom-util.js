var util = exports;

util.EscapedString = function(string) {
    this.string = string;
    this.toString = function() {
        return this.string;
    }
};

util.escape = function(value) {
    if (!value || value instanceof util.EscapedString) return value;
    return value.toString().replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;");
};

util.getBody = function(object) {
    if (!object) return object;
    if (typeof object.getBody === "function")
        return object.getBody();
    if (object.getMetadata && object.getMetadata().getProfile) {
        var profile = object.getMetadata().getProfile();
        if (typeof profile.prototype.getBody === "function")
            return profile.prototype.getBody.apply(object);
    };
};

util.getLink = function(object) {
    var id = object.getId ? object.getId() : object.id;
    if (object.getMetadata && object.getMetadata().getProfile) {
        return util.escape("/" + object.getMetadata().getProfile().id + "/" + id);
    }
    return util.escape(id);
};

util.getTitle = function(object) {
    if (!object) return object;
    if (typeof object.getTitle === "function")
        return util.escape(object.getTitle());
    if (object.getMetadata && object.getMetadata().getProfile) {
        var profile = object.getMetadata().getProfile();
        if (typeof profile.prototype.getTitle === "function")
            return util.escape(profile.prototype.getTitle.apply(object));
    };
    return util.escape(object.id);
};

util.getUpdated = function(object) {
    if (typeof object.getUpdated === "function")
        return object.getUpdated();
    if (object.getMetadata && object.getMetadata()["last-modified"])
        return object.getMetadata()["last-modified"];
};

util.getRevision = function(object) {
    if (typeof object.getRevision === "function")
        return util.escape(object.getRevision());
    if (object.getMetadata && object.getMetadata()["etag"])
        return util.escape(object.getMetadata()["etag"]);
    //return "aa4asf45ewey";
};

util.getSummary = function(object) {
    if (!object) return object;
    if (typeof object.getSummary === "function")
        return util.escape(object.getSummary());
    if (object.getMetadata && object.getMetadata().getProfile) {
        var profile = object.getMetadata().getProfile();
        if (typeof profile.prototype.getSummary === "function")
            return util.escape(profile.prototype.getSummary.apply(object));
    };
    return util.escape("keys: " + Object.keys(object));
};

util.getContent = function(object) {
    if (!object) return object;
    if (typeof object.getContent === "function")
        return util.escape(object.getContent());
    if (object.getMetadata && object.getMetadata().getProfile) {
        var profile = object.getMetadata().getProfile();
        if (typeof profile.prototype.getContent === "function")
            return util.escape(profile.prototype.getContent.apply(object));
    };
    
    // fall back on default serialization
    var s = '  <dl class="properties">\n';
    for (var key in object) {
        if (typeof object[key] === "function") continue;
        if (typeof object[key] === "object") {
            if (object[key].$ref) {
                s += '    <dt>' + key + '</dt><dd><a href="' + object.id + "." + key + '">[link]</a>';
                if (key == "xml") s += ' <a target="_blank" href="' + object.id + '?http-x-edit">[edit]</a>';
                s += '</dd>';
            }
            else {
                s += '    <dt>' + key + '</dt><dd><a href="' + object.id + "." + key + '">' + object[key] + '</a></dd>';
            }
        }
        else {
            s += '    <dt>' + key + '</dt><dd>' + object[key] + '</dd>\n';
        }
    }
    s += '  </dl>\n';
    return s;
};
