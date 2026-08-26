const assert = require('node:assert/strict');

const pkg = require('@sargadil/tabs/package.json');

assert.equal(pkg.main, './dist/js/tabs.cjs', '"main" should point at the CJS build');
assert.equal(pkg.module, './dist/js/tabs.mjs', '"module" should point at the ESM build');
assert.equal(pkg.types, './dist/js/tabs.d.ts', '"types" should point at the declaration file');
assert.equal(pkg.unpkg, './dist/js/tabs.umd.js', '"unpkg" should point at the UMD build');
assert.equal(pkg.jsdelivr, './dist/js/tabs.umd.js', '"jsdelivr" should point at the UMD build');

assert.equal(pkg.exports['.'].import, './dist/js/tabs.mjs', 'exports["."].import should point at the ESM build');
assert.equal(pkg.exports['.'].require, './dist/js/tabs.cjs', 'exports["."].require should point at the CJS build');
assert.equal(pkg.exports['.'].types, './dist/js/tabs.d.ts', 'exports["."].types should point at the declaration file');
assert.equal(pkg.exports['./style.css'], './dist/css/styles.min.css', 'exports["./style.css"] should point at the compiled CSS');

console.log('exports metadata ok');
