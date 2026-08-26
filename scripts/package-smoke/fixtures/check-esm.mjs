import assert from 'node:assert/strict';

import Tabs from '@sargadil/tabs';

assert.equal(typeof Tabs, 'function', 'import Tabs from "@sargadil/tabs" should resolve to the Tabs constructor');
assert.equal(typeof Tabs.prototype.destroy, 'function', 'Tabs.prototype should expose destroy()');
assert.equal(typeof Tabs.prototype.selectTab, 'function', 'Tabs.prototype should expose selectTab()');
assert.equal(typeof Tabs.prototype.getSelectedIndex, 'function', 'Tabs.prototype should expose getSelectedIndex()');

console.log('esm import ok');
