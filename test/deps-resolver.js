var depsResolve = require('../index.js');
var mock = require('mock-fs');
var walker = require('bem-walk');
var techDeps = require('tech-deps.js');
var assert = require('stream-assert');

afterEach(function () {
    mock.restore();
});

it('should resolve one block', function (done) {
    mock({
        'blocks': {
            a: {
                'a.css': ''
            }
        }
    });

    var deps = walker(['blocks'])
        .pipe(techDeps())
        .pipe(depsResolve(['blocks']));

    deps
        .resolve([{
            block: 'a'
        }])
        .pipe(assert.first(function (obj) { return obj.block === 'a'; }))
        .pipe(assert.length(1))
        .pipe(assert.end(done));
});

it('should resolve simple mustDeps', function (done) {
    mock({
        'blocks': {
            a: {
                'a.deps.js': 'exports.mustDeps = "b";'
            },
            b: {
                'b.css': ''
            }
        }
    });

    var deps = walker(['blocks'])
        .pipe(techDeps())
        .pipe(depsResolve());

    deps
        .resolve([{
            block: 'a'
        }])
        .pipe(assert.first(function (obj) { return obj.block === 'b'; }))
        .pipe(assert.second(function (obj) { return obj.block === 'a'; }))
        .pipe(assert.length(2))
        .pipe(assert.end(done));
});

it('should resolve simple shouldDeps', function (done) {
    mock({
        'blocks': {
            a: {
                'a.deps.js': 'exports.shouldDeps = "b";'
            },
            b: {
                'b.css': ''
            }
        }
    });

    var deps = walker(['blocks'])
        .pipe(techDeps())
        .pipe(depsResolve(['blocks']));

    deps
        .resolve([{
            block: 'a'
        }])
        .pipe(assert.first(function (obj) { return obj.block === 'a'; }))
        .pipe(assert.second(function (obj) { return obj.block === 'b'; }))
        .pipe(assert.length(2))
        .pipe(assert.end(done));
});

it('should resolve block in levels', function (done) {
    mock({
        'common': {
            a: {
                'a.css': ''
            }
        },
        'blocks': {
            a: {
                'a.css': ''
            }
        }
    });

    var deps = walker(['common','blocks'])
        .pipe(techDeps())
        .pipe(depsResolve(['common','blocks']));

    deps
        .resolve([{
            block: 'a'
        }])
        .pipe(assert.first(function (obj) { return obj.block === 'a' && obj.level === 'common'; }))
        .pipe(assert.second(function (obj) { return obj.block === 'a' && obj.level === 'blocks'; }))
        .pipe(assert.length(2))
        .pipe(assert.end(done));
});

it('should resolve block shouldDeps in levels', function (done) {
    mock({
        'common': {
            a: {
                'a.deps.js': 'exports.shouldDeps = "b"'
            },
            b: {
                'b.css': ''
            }
        },
        'blocks': {
            a: {
                'a.css': ''
            }
        }
    });

    var deps = walker(['common','blocks'])
        .pipe(techDeps())
        .pipe(depsResolve(['common','blocks']));

    deps
        .resolve([{
            block: 'a'
        }])
        .pipe(assert.nth(0, function (obj) { return obj.block === 'a' && obj.level === 'common'; }))
        .pipe(assert.nth(1, function (obj) { return obj.block === 'a' && obj.level === 'blocks'; }))
        .pipe(assert.nth(2, function (obj) { return obj.block === 'b' && obj.level === 'common'; }))
        .pipe(assert.nth(3, function (obj) { return obj.block === 'b' && obj.level === 'blocks'; }))
        .pipe(assert.length(4))
        .pipe(assert.end(done));
});

it('should resolve block mustDeps in levels', function (done) {
    mock({
        'common': {
            a: {
                'a.css': ''
            },
            b: {
                'b.css': ''
            }
        },
        'blocks': {
            a: {
                'a.deps.js': 'exports.mustDeps = "b"'
            }
        }
    });

    var deps = walker(['common','blocks'])
        .pipe(techDeps())
        .pipe(depsResolve(['common','blocks']));

    deps
        .resolve([{
            block: 'a'
        }])
        .pipe(assert.nth(0, function (obj) { return obj.block === 'b' && obj.level === 'common'; }))
        .pipe(assert.nth(1, function (obj) { return obj.block === 'b' && obj.level === 'blocks'; }))
        .pipe(assert.nth(2, function (obj) { return obj.block === 'a' && obj.level === 'common'; }))
        .pipe(assert.nth(3, function (obj) { return obj.block === 'a' && obj.level === 'blocks'; }))
        .pipe(assert.length(4))
        .pipe(assert.end(done));
});
