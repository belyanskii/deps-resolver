var through = require('through2');
var Resolver = require('./deps-resolver.js');

module.exports = function () {

    var Datastore = require('nedb'),
        db = new Datastore();

    var output = through.obj(function (obj, enc, cb) {
        db.insert(obj);
        cb(null, obj);
    });

    var resolver = new Resolver();
    var done = false;

    output.on('end', function () {
        done = true;
    });

    output.resolve = function (decls) {
        var result = through.obj();

        if (!done) {
            output.on('end', function () {
                // call resolver
            });
        } else {
            // call resolver
        }

        return result;
    };

    return output;
};
