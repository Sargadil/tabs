const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { setup, click, keydown } = require('./helpers/setup');

describe('hidden attribute as source of truth for panel visibility', () => {
    test('initialization: the panel at initSelectedItem is visible, all others are hidden', () => {
        const { Tabs, document } = setup();
        new Tabs();
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.equal(panels[0].hidden, false);
        assert.equal(panels[1].hidden, true);
        assert.equal(panels[2].hidden, true);
    });

    test('initialization respects a non-zero initSelectedItem', () => {
        const { Tabs, document } = setup();
        new Tabs({ options: { initSelectedItem: 1 } });
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.equal(panels[0].hidden, true);
        assert.equal(panels[1].hidden, false);
        assert.equal(panels[2].hidden, true);
    });

    test('click hides the old panel and unhides the new one', () => {
        const { Tabs, dom, document } = setup();
        new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        click(buttons[2], dom);

        assert.equal(panels[0].hidden, true);
        assert.equal(panels[1].hidden, true);
        assert.equal(panels[2].hidden, false);
    });

    test('automatic keyboard activation hides the old panel and unhides the new one', () => {
        const { Tabs, dom, document } = setup();
        new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        click(buttons[0], dom);
        keydown(buttons[0], dom, 'ArrowRight');

        assert.equal(panels[0].hidden, true);
        assert.equal(panels[1].hidden, false);
        assert.equal(panels[2].hidden, true);
    });

    test('manual activation mode: moving focus alone does not touch hidden; activating does', () => {
        const { Tabs, dom, document } = setup();
        new Tabs({ options: { activationMode: 'manual' } });
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        keydown(buttons[0], dom, 'ArrowRight');
        assert.equal(panels[0].hidden, false, 'focus move alone must not hide the active panel');
        assert.equal(panels[1].hidden, true, 'focus move alone must not unhide the focused-but-unselected panel');

        click(buttons[1], dom);
        assert.equal(panels[0].hidden, true);
        assert.equal(panels[1].hidden, false);
    });

    test('selectTab() hides the old panel and unhides the new one', () => {
        const { Tabs, document } = setup();
        const instance = new Tabs();
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        instance.selectTab(2);

        assert.equal(panels[0].hidden, true);
        assert.equal(panels[1].hidden, true);
        assert.equal(panels[2].hidden, false);
    });

    test('exactly one panel is unhidden after any sequence of interactions', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        click(buttons[1], dom);
        keydown(buttons[1], dom, 'End');
        instance.selectTab(0);
        click(buttons[1], dom);

        const visible_count = Array.from(panels).filter((panel) => !panel.hidden).length;
        assert.equal(visible_count, 1);
    });
});
