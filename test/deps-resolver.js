var depsResolve = require('../index.js');
var mock = require('mock-fs');
var walker = require('bem-walk')
var techDeps = require('tech-deps.js');
var assert = require('stream-assert');

it('should resolve', function (done) {
    var deps = walker(['blocks'])
        .pipe(techDeps())
        .pipe(depsResolve());

    deps
        .resolve([{
            block: 'block'
        }])
        .pipe(assert.first(function (obj) {  }))
        .pipe(assert.second(function (obj) {  }))
        .pipe(assert.length(2))
        .pipe(assert.end());
});
