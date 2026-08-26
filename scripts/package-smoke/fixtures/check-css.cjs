const assert = require('node:assert/strict');
const fs = require('node:fs');

const cssPath = require.resolve('@sargadil/tabs/style.css');

assert.ok(fs.existsSync(cssPath), `resolved style.css path does not exist: ${cssPath}`);

const css = fs.readFileSync(cssPath, 'utf8');
assert.ok(css.trim().length > 0, 'style.css should not be empty');

console.log('css export ok');
