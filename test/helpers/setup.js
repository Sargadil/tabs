'use strict';

/**
 * Shared boot for the unit/integration suites (`test/*.test.js`).
 *
 * `setup()` starts a fresh jsdom document, wires the globals the bundle
 * needs, and re-requires `dist/js/tabs.cjs` so each test starts from a
 * clean module state. `click` / `keydown` / `touch` dispatch the DOM
 * events the specs use.
 *
 * HTML fixtures live in `./fixtures`.
 */

const path = require('node:path');
const { JSDOM } = require('jsdom');

const { DEFAULT_HTML } = require('./fixtures');

const TABS_CJS = path.join(__dirname, '..', '..', 'dist', 'js', 'tabs.cjs');

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

module.exports = { setup, click, keydown, touch };
