var depsResolve = require('../index.js');
var mock = require('mock-fs');
var walker = require('bem-walk');
var techDeps = require('tech-deps.js');
var assert = require('stream-assert');

it('should resolve', function (done) {
    var deps = walker(['blocks'])
        .pipe(techDeps())
        .pipe(depsResolve());

    deps
        .resolve([{
            block: 'a1'
        }])
        .pipe(assert.first(function (obj) { console.log(obj); }))
        .pipe(assert.length(1))
        .pipe(assert.end(done));
});
