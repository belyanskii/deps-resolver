var through = require('through2');
var Resolver = require('./deps-resolver.js');
var bemObject = require('bem-object');

module.exports = function (levels) {

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

    var result = through.obj();

    function callResolver(decls) {
        var resolver = new Resolver(buffer);

        //var nameDecls = decls.map(function(dec) {
        //    dec.name = dec.block;
        //    return dec;
        //});

        resolver.addDecls(decls.map(function(item) {
            return {
                block: item.block,
                elem: item.elem,
                modName: item.mod,
                modVal: item.val
            };
        })).then(function() {
            var resolved = resolver.resolve();
            resolved.forEach(function (obj) {
                if (levels) {
                    levels.forEach(function (level) {
                        obj.level = level;
                        result.write(obj);
                    });
                } else {
                    result.write(obj);
                }

            });
            result.end();
        }).catch(function (err) {
            result.emit('error', err);
            result.end();
        });
    }

    output.resolve = function (decls) {
        if (!done) {
            output.on('finish', callResolver.bind(null, decls));
        } else {
            callResolver(decls);
        }

        return result;
    };

    return output;
};
