const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pkg = require('@sargadil/tabs/package.json');
const pkgDir = path.dirname(require.resolve('@sargadil/tabs/package.json'));
const typesPath = path.join(pkgDir, pkg.exports['.'].types);

assert.ok(fs.existsSync(typesPath), `declared types file does not exist: ${typesPath}`);

const dts = fs.readFileSync(typesPath, 'utf8');
assert.ok(/declare|export/.test(dts), 'types file does not look like a TypeScript declaration file');
assert.match(dts, /export default class Tabs/, 'types file should declare the Tabs class');
assert.match(dts, /refresh\(\): void;/, 'types file should declare the refresh() method');

console.log('typescript declarations ok');
