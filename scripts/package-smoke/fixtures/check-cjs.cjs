const assert = require('node:assert/strict');

const Tabs = require('@sargadil/tabs');

assert.equal(typeof Tabs, 'function', 'require("@sargadil/tabs") should resolve to the Tabs constructor');
assert.equal(typeof Tabs.prototype.destroy, 'function', 'Tabs.prototype should expose destroy()');
assert.equal(typeof Tabs.prototype.selectTab, 'function', 'Tabs.prototype should expose selectTab()');
assert.equal(typeof Tabs.prototype.getSelectedIndex, 'function', 'Tabs.prototype should expose getSelectedIndex()');

console.log('commonjs import ok');
