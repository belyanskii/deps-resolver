var through = require('through2');
var Resolver = require('./deps-resolver.js');
var bemObject = require('bem-object');

module.exports = function () {

    //var Datastore = require('nedb'),
    //    db = new Datastore();

    var buffer = [];

    var output = through.obj(function (obj, enc, cb) {
        // db.insert(obj);
        // cb(null, obj);
        buffer.push(obj);
        cb(null);
    });

    var done = false;

    output.on('finish', function () {
        done = true;
    });

    output.resolve = function (decls) {
        var resolver = new Resolver(buffer);
        var result = through.obj();

        var nameDecls = decls.map(function(dec) {
            dec.name = dec.block;
            return dec;
        });

        resolver.addDecls(nameDecls.map(function(item) {
            return {
                name: item.block,
                elem: item.elem,
                modName: item.mod,
                modVal: item.val
            };
        })).then(function() {
            var resolved = resolver.resolve();
            if (!done) {
                output.on('finish', function () {
                    resolved.forEach(function (obj) {
                        result.write(obj);
                    });
                    result.end();
                });
            } else {
                resolved.forEach(function (obj) {
                    result.write(obj);
                });
                result.end();
            }
        });

        return result;
    };

    return output;
};
