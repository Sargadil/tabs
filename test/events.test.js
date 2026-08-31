const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { setup, click, keydown } = require('./helpers/setup');
const { DEFAULT_HTML } = require('./helpers/fixtures');

describe('tabs:beforechange event', () => {
    test('fires with {fromIndex, toIndex, fromTab, toTab, fromPanel, toPanel} before tabs:change, and is cancelable + bubbles', () => {
        const { Tabs, dom, document } = setup();
        new Tabs();
        const container = document.getElementById('tabs');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');
        const events = [];

        container.addEventListener('tabs:beforechange', (e) => events.push({ type: 'tabs:beforechange', event: e }));
        container.addEventListener('tabs:change', (e) => events.push({ type: 'tabs:change', event: e }));

        click(buttons[2], dom);

        assert.equal(events.length, 2, 'both events must fire exactly once');
        assert.equal(events[0].type, 'tabs:beforechange', 'tabs:beforechange must fire before tabs:change');
        assert.equal(events[1].type, 'tabs:change');

        const before = events[0].event;
        assert.equal(before.cancelable, true);
        assert.equal(before.bubbles, true);
        assert.equal(before.detail.fromIndex, 0);
        assert.equal(before.detail.toIndex, 2);
        assert.equal(before.detail.fromTab, buttons[0]);
        assert.equal(before.detail.toTab, buttons[2]);
        assert.equal(before.detail.fromPanel, panels[0]);
        assert.equal(before.detail.toPanel, panels[2]);
    });

    test('fires before any ARIA/hidden mutation happens', () => {
        const { Tabs, dom, document } = setup();
        new Tabs();
        const container = document.getElementById('tabs');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');
        let snapshot = null;

        container.addEventListener('tabs:beforechange', () => {
            snapshot = {
                oldSelected: buttons[0].getAttribute('aria-selected'),
                newSelected: buttons[2].getAttribute('aria-selected'),
                oldPanelHidden: panels[0].hidden,
                newPanelHidden: panels[2].hidden,
            };
        });

        click(buttons[2], dom);

        assert.deepEqual(snapshot, {
            oldSelected: 'true',
            newSelected: 'false',
            oldPanelHidden: false,
            newPanelHidden: true,
        }, 'the listener must see pre-transition state');
    });

    test('click: preventDefault() keeps aria-selected, tabindex, hidden panels, and selected index unchanged, and restores focus', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const container = document.getElementById('tabs');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        container.addEventListener('tabs:beforechange', (e) => e.preventDefault());

        // A real browser focuses the clicked button on mousedown, before the click
        // handler (and therefore our cancellation check) ever runs; jsdom's synthetic
        // click does not reproduce that on its own, so it's simulated explicitly here.
        buttons[2].focus();
        click(buttons[2], dom);

        assert.equal(buttons[0].getAttribute('aria-selected'), 'true');
        assert.equal(buttons[2].getAttribute('aria-selected'), 'false');
        assert.equal(buttons[0].tabIndex, 0);
        assert.equal(buttons[2].tabIndex, -1);
        assert.equal(panels[0].hidden, false);
        assert.equal(panels[2].hidden, true);
        assert.equal(instance.getSelectedIndex(), 0);
        assert.equal(document.activeElement, buttons[0], 'focus is restored to the still-selected tab');
    });

    test('click: does not dispatch tabs:change when canceled', () => {
        const { Tabs, dom, document } = setup();
        new Tabs();
        const container = document.getElementById('tabs');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        let change_fired = false;

        container.addEventListener('tabs:beforechange', (e) => e.preventDefault());
        container.addEventListener('tabs:change', () => { change_fired = true; });

        click(buttons[1], dom);

        assert.equal(change_fired, false);
    });

    test('keyboard: preventDefault() keeps aria-selected, tabindex, hidden panels, and focus unchanged', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const container = document.getElementById('tabs');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        buttons[0].focus();
        container.addEventListener('tabs:beforechange', (e) => e.preventDefault());

        keydown(buttons[0], dom, 'ArrowRight');

        assert.equal(buttons[0].getAttribute('aria-selected'), 'true');
        assert.equal(buttons[1].getAttribute('aria-selected'), 'false');
        assert.equal(buttons[0].tabIndex, 0);
        assert.equal(buttons[1].tabIndex, -1);
        assert.equal(panels[0].hidden, false);
        assert.equal(instance.getSelectedIndex(), 0);
        assert.equal(document.activeElement, buttons[0]);
    });

    test('selectTab(): preventDefault() keeps state unchanged and does not throw', () => {
        const { Tabs, document } = setup();
        const instance = new Tabs();
        const container = document.getElementById('tabs');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        container.addEventListener('tabs:beforechange', (e) => e.preventDefault());

        assert.doesNotThrow(() => instance.selectTab(2));
        assert.equal(instance.getSelectedIndex(), 0);
        assert.equal(panels[0].hidden, false);
        assert.equal(panels[2].hidden, true);
    });

    test('selectTab(): a canceled change does not steal focus from unrelated elements', () => {
        const { Tabs, document } = setup(`<input id="outside" type="text">${DEFAULT_HTML}`);
        const instance = new Tabs();
        const container = document.getElementById('tabs');
        const outside = document.getElementById('outside');

        outside.focus();
        container.addEventListener('tabs:beforechange', (e) => e.preventDefault());

        instance.selectTab(2);

        assert.equal(document.activeElement, outside, 'focus must not move into the tablist');
    });

    test('normal (non-canceled) transition still fires tabs:change with the same {index, tab, panel} contract', () => {
        const { Tabs, dom, document } = setup();
        new Tabs();
        const container = document.getElementById('tabs');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');
        let detail = null;

        container.addEventListener('tabs:change', (e) => { detail = e.detail; });

        click(buttons[1], dom);

        assert.equal(detail.index, 1);
        assert.equal(detail.tab, buttons[1]);
        assert.equal(detail.panel, panels[1]);
    });
});
