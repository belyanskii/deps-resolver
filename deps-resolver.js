/**
 * DepsResolver
 * ============
 */

var inherit = require('inherit');
var vow = require('vow');

function DepsError(message) {
    this.message = message;
    Error.captureStackTrace(this, DepsError);
}
DepsError.prototype = Object.create(Error.prototype);
DepsError.prototype.name = 'Deps error';

/**
 * DepsResolver — класс, раскрывающий deps'ы.
 * @name DepsResolver
 */
module.exports = inherit({

    /**
     * Конструктор.
     * @param {Level[]} deps
     */
    __constructor: function (deps) {
        this.deps = deps;
        this.declarations = [];
        this.resolved = {};
        this.declarationIndex = {};
    },

    /**
     * Возвращает deps'ы для декларации (с помощью levels).
     * @param {Object} decl
     * @returns {{mustDeps: Array, shouldDeps: Array}}
     */
    getDeps: function (decl) {
        var _this = this,
            mustDecls,
            files;
        if (decl.elem) {
            //files = this.levels.getElemFiles(decl.name, decl.elem, decl.modName, decl.modVal);
            files = this.deps.filter(function(dep) {
                return dep.block === decl.name &&
                    dep.elem === decl.elem &&
                    dep.modName === decl.modName &&
                    dep.modVal === decl.modVal;
            });

        } else {
            //files = this.levels.getBlockFiles(decl.name, decl.modName, decl.modVal);
            files = this.deps.filter(function(dep) {
                return dep.block === decl.name &&
                    dep.modName === decl.modName &&
                    dep.modVal === decl.modVal;
            });
        }

        var mustDepIndex = {},
            shouldDepIndex = {};
        mustDepIndex[declKey(decl)] = true;
        var mustDeps = [];
        if (decl.modName) {
            if (decl.elem) {
                mustDecls = [
                    { name: decl.name, elem: decl.elem }
                ];
                if (decl.modVal) {
                    mustDecls.push({ name: decl.name, elem: decl.elem, modName: decl.modName });
                }
            } else {
                mustDecls = [
                    { name: decl.name }
                ];
                if (decl.modVal) {
                    mustDecls.push({ name: decl.name, modName: decl.modName });
                }
            }
            mustDecls.forEach(function (mustDecl) {
                mustDecl.key = declKey(mustDecl);
                mustDepIndex[mustDecl.key] = true;
                mustDeps.push(mustDecl);
            });
        }
        var shouldDeps = [];

        function keepWorking(depData) {
            depData = Array.isArray(depData) ? depData : [depData];
            depData.forEach(function (dep) {
                if (dep.require) {
                    dep.require.forEach(function (nd) {
                        var key = declKey(nd);
                        if (!mustDepIndex[key]) {
                            mustDepIndex[key] = true;
                            nd.key = key;
                            //nd.level = dep.level;
                            mustDeps.push(nd);
                        }
                    });
                }
                if (dep.expect) {
                    dep.expect.forEach(function (nd) {
                        var key = declKey(nd);
                        if (!shouldDepIndex[key]) {
                            shouldDepIndex[key] = true;
                            nd.key = key;
                            shouldDeps.push(nd);
                        }
                    });
                }
            });

            if (files.length > 0) {
                return keepWorking(files.shift());
            } else {
                return null;
            }
        }

        function removeFromDeps(decl, index, list) {
            if (index[decl.key]) {
                for (var i = 0, l = list.length; i < l; i++) {
                    if (list[i].key === decl.key) {
                        return list.splice(i, 1);
                    }
                }
            } else {
                index[decl.key] = true;
            }
            return null;
        }

        var result = { mustDeps: mustDeps, shouldDeps: shouldDeps };

        if (files.length > 0) {
            return keepWorking(files.shift()).then(function () {
                return result;
            });
        } else {
            return vow.fulfill(result);
        }
    },

    /**
     * Добавляет декларацию в резолвер.
     * @param {Object} decl
     * @returns {Promise}
     */
    addDecl: function (decl) {
        var _this = this,
            key = declKey(decl);
        if (this.declarationIndex[key]) {
            return null;
        }
        this.declarations.push(decl);
        this.declarationIndex[key] = decl;
        return this.getDeps(decl).then(function (deps) {
            decl.key = key;
            decl.deps = {};
            decl.depCount = 0;
            return _this.addDecls(deps.mustDeps, function (dep) {
                decl.deps[dep.key] = true;
                decl.depCount++;
            }).then(function () {
                return _this.addDecls(deps.shouldDeps);
            });
        });
    },

    /**
     * Добавляет набор деклараций.
     * @param {Array} decls
     * @returns {Promise}
     * @param {Function} [preCallback]
     */
    addDecls: function (decls, preCallback) {
        var promise = vow.fulfill(),
            _this = this;
        decls.forEach(function (decl) {
            promise = promise.then(function () {
                if (preCallback) {
                    preCallback(decl);
                }
                return _this.addDecl(decl);
            });
        });
        return promise;
    },

    /**
     * Упорядочивает deps'ы, возвращает в порядке зависимостей.
     * @returns {Array}
     */
    resolve: function () {
        var items = this.declarations.slice(0),
            result = [],
            hasChanges = true,
            newItems;

        while (hasChanges) {
            newItems = [];
            hasChanges = false;
            for (var i = 0, l = items.length; i < l; i++) {
                var decl = items[i];
                if (decl.depCount === 0) {
                    hasChanges = true;
                    for (var j = 0; j < l; j++) {
                        var subDecl = items[j];
                        if (subDecl.deps[decl.key]) {
                            delete subDecl.deps[decl.key];
                            subDecl.depCount--;
                        }
                    }
                    var item = {
                        block: decl.name
                    };
                    if (decl.elem) {
                        item.elem = decl.elem;
                    }
                    if (decl.modName) {
                        item.mod = decl.modName;
                        if (decl.hasOwnProperty('modVal')) {
                            item.val = decl.modVal;
                        }
                    }
                    result.push(item);
                } else {
                    newItems.push(decl);
                }
            }
            items = newItems;
        }
        if (items.length) {
            var errorMessage = items.map(function (item) {
                return item.key + ' <- ' + Object.keys(item.deps).join(', ');
            });
            throw Error('Unresolved deps: \n' + errorMessage.join('\n'));
        }
        return result;
    }
});

function declKey(decl) {
   return decl.name + (decl.elem ? '__' + decl.elem : '') +
       (decl.modName ? '_' + decl.modName + (decl.modVal ? '_' + decl.modVal : '') : '');
}
