'use strict';

/**
 * Shared setup for the unit/integration suites (`test/*.test.js`).
 *
 * `setup()` boots a fresh jsdom document, wires the globals the bundle
 * needs, and re-requires `dist/js/tabs.cjs` so each test starts from a
 * clean module state. `click` / `keydown` / `touch` dispatch the DOM
 * events the specs use.
 *
 * Per-suite HTML fixtures live next to the suites that use them; only the
 * two markup shapes shared across suites are exported here.
 */

const path = require('node:path');
const { JSDOM } = require('jsdom');

const TABS_CJS = path.join(__dirname, '..', '..', 'dist', 'js', 'tabs.cjs');

const DEFAULT_HTML = `
<div class="tabs" id="tabs">
    <div class="tabs__nav"></div>
    <div class="tabs__panels">
        <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
        <div class="tab-panel"><h3 class="tab-panel__title">Two</h3><div class="tab-panel__content">2</div></div>
        <div class="tab-panel"><h3 class="tab-panel__title">Three</h3><div class="tab-panel__content">3</div></div>
    </div>
</div>
`;

const CUSTOM_NAV_HTML = `
<div class="tabs" id="tabs">
    <div class="custom-tabs__nav">
        <div class="custom-tabs__nav-inner">
            <button class="custom-tabs__nav-button" role="tab">Tab 1</button>
            <button class="custom-tabs__nav-button" role="tab">Tab 2</button>
        </div>
    </div>
    <div class="tabs__panels">
        <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
        <div class="tab-panel"><h3 class="tab-panel__title">Two</h3><div class="tab-panel__content">2</div></div>
    </div>
</div>
`;

function setup(html = DEFAULT_HTML) {
    const dom = new JSDOM(html, { runScripts: 'outside-only' });

    global.window = dom.window;
    global.document = dom.window.document;
    global.CustomEvent = dom.window.CustomEvent;
    global.HTMLElement = dom.window.HTMLElement;

    delete require.cache[require.resolve(TABS_CJS)];
    const Tabs = require(TABS_CJS);

    return { Tabs, dom, document: dom.window.document };
}

function click(el, dom) {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
}

function keydown(el, dom, key) {
    el.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function touch(el, dom, type, x, y) {
    const event = new dom.window.Event(type, { bubbles: true });
    event.changedTouches = [{ screenX: x, screenY: y }];
    el.dispatchEvent(event);
}

module.exports = { setup, click, keydown, touch, DEFAULT_HTML, CUSTOM_NAV_HTML };
