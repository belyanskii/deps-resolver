var through = require('through2');
var after = require('after-event');
var Resolver = require('./deps-resolver.js');

module.exports = function () {

    var Datastore = require('nedb'),
        db = new Datastore();

    var output = through.obj(function (obj, enc, cb) {
        db.insert(obj);
        cb(null, obj);
    });

    var resolver = new Resolver();

    after(output, 'end', function () {});

    output.resolve = function (decls) {
        var result = through.obj();

        after(output, 'end', function () {

        });

        return result;
    };

    return output;
};
