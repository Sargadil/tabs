const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const path = require('node:path');

const TABS_CJS = path.join(__dirname, '..', 'dist', 'js', 'tabs.cjs');

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

describe('default nav: WAI-ARIA structure', () => {
    test('sets role=tabpanel, aria-labelledby, and role=tablist', () => {
        const { Tabs, document } = setup();
        new Tabs({ options: { ariaLabel: 'Info' } });

        const tablist = document.querySelector('[role="tablist"]');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.equal(tablist.getAttribute('aria-label'), 'Info');
        assert.equal(panels.length, 3);
        assert.equal(panels[0].getAttribute('aria-labelledby'), buttons[0].id);
        assert.equal(panels[1].getAttribute('aria-labelledby'), buttons[1].id);
    });

    test('missing .tab-panel throws a friendly error', () => {
        const { Tabs } = setup('<div class="tabs" id="tabs"><div class="tabs__nav"></div><div class="tabs__panels"></div></div>');

        assert.throws(() => new Tabs(), /tab panels should exist/);
    });

    test('missing .tabs__nav throws a friendly error', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
            </div>
        </div>`;
        const { Tabs } = setup(html);

        assert.throws(() => new Tabs(), /tabsNavContainer element should exist/);
    });
});

describe('custom nav', () => {
    test('adds role=tablist and ids without clobbering existing ones', () => {
        const { Tabs, document } = setup(CUSTOM_NAV_HTML);
        new Tabs({
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true },
        });

        const tablist = document.querySelector('.custom-tabs__nav-inner');
        const buttons = document.querySelectorAll('.custom-tabs__nav-button');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.equal(tablist.getAttribute('role'), 'tablist');
        assert.equal(panels[0].getAttribute('aria-labelledby'), buttons[0].id);
    });
});

describe('keyboard navigation', () => {
    test('Home/End select the first/last tab', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        click(buttons[1], dom);
        keydown(buttons[1], dom, 'End');
        assert.equal(instance.getSelectedIndex(), 2);

        keydown(buttons[2], dom, 'Home');
        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('roving tabindex: exactly one tab has tabIndex 0', () => {
        const { Tabs, dom, document } = setup();
        new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        click(buttons[1], dom);
        keydown(buttons[1], dom, 'ArrowRight');

        const zeroCount = Array.from(buttons).filter((b) => b.tabIndex === 0).length;
        assert.equal(zeroCount, 1);
        assert.equal(buttons[2].tabIndex, 0);
    });
});

describe('orientation', () => {
    test('vertical mode uses ArrowUp/Down, ignores ArrowLeft/Right, and sets aria-orientation', () => {
        const { Tabs, dom, document } = setup();
        new Tabs({ options: { orientation: 'vertical' } });

        const tablist = document.querySelector('[role="tablist"]');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        assert.equal(tablist.getAttribute('aria-orientation'), 'vertical');

        click(buttons[0], dom);
        keydown(buttons[0], dom, 'ArrowRight');
        assert.equal(buttons[0].getAttribute('aria-selected'), 'true', 'ArrowRight should be ignored in vertical mode');

        keydown(buttons[0], dom, 'ArrowDown');
        assert.equal(buttons[1].getAttribute('aria-selected'), 'true');
    });
});

describe('manual activation mode', () => {
    test('arrow keys move focus without selecting; click/Enter activates', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs({ options: { activationMode: 'manual' } });
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowRight');
        assert.equal(instance.getSelectedIndex(), 0, 'focus move alone must not select');
        assert.equal(document.activeElement, buttons[1]);

        click(buttons[1], dom);
        assert.equal(instance.getSelectedIndex(), 1);
    });
});

describe('public API', () => {
    test('selectTab()/getSelectedIndex() switch tabs and validate the index', () => {
        const { Tabs, document } = setup();
        const instance = new Tabs();

        assert.equal(instance.getSelectedIndex(), 0);
        instance.selectTab(2);
        assert.equal(instance.getSelectedIndex(), 2);

        assert.doesNotThrow(() => instance.selectTab(2), 'selecting the already-active tab is a no-op');
        assert.throws(() => instance.selectTab(99), /no tab exists at index 99/);
    });

    test('destroy() removes click/keydown listeners', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        instance.destroy();
        click(buttons[1], dom);

        assert.equal(instance.getSelectedIndex(), 0, 'click after destroy() must be inert');
    });

    test('tabs:change fires with {index, tab, panel} on every real switch', () => {
        const { Tabs, dom, document } = setup();
        new Tabs();
        const container = document.getElementById('tabs');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const events = [];

        container.addEventListener('tabs:change', (e) => events.push(e.detail));

        click(buttons[1], dom);
        click(buttons[1], dom); // re-clicking the active tab must not fire again

        assert.equal(events.length, 1);
        assert.equal(events[0].index, 1);
        assert.equal(events[0].tab, buttons[1]);
    });

    test('contextID accepts an element directly, no id required', () => {
        const html = DEFAULT_HTML.replace('id="tabs"', '');
        const { Tabs, dom, document } = setup(html);
        const container = document.querySelector('.tabs');

        assert.equal(container.id, '');

        const instance = new Tabs({ contextID: container });
        const buttons = container.querySelectorAll('[role="tab"]');

        click(buttons[1], dom);
        assert.equal(instance.getSelectedIndex(), 1);
    });
});

describe('multiple instances on one page', () => {
    test('default tabPanelIdPrefix does not collide across instances', () => {
        const html = `
        <div class="tabs" id="tabs-a">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">A1</h3><div class="tab-panel__content">a1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title">A2</h3><div class="tab-panel__content">a2</div></div>
            </div>
        </div>
        <div class="tabs" id="tabs-b">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">B1</h3><div class="tab-panel__content">b1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title">B2</h3><div class="tab-panel__content">b2</div></div>
            </div>
        </div>`;
        const { Tabs, dom, document } = setup(html);

        const instanceA = new Tabs({ contextID: 'tabs-a' });
        const instanceB = new Tabs({ contextID: 'tabs-b' });

        const allIds = [
            ...document.querySelectorAll('#tabs-a [role="tabpanel"], #tabs-a [role="tab"]'),
            ...document.querySelectorAll('#tabs-b [role="tabpanel"], #tabs-b [role="tab"]'),
        ].map((el) => el.id);

        assert.equal(new Set(allIds).size, allIds.length, 'all generated ids must be unique');

        click(document.querySelectorAll('#tabs-b [role="tab"]')[1], dom);
        assert.equal(instanceA.getSelectedIndex(), 0, 'instance A must be unaffected by instance B');
        assert.equal(instanceB.getSelectedIndex(), 1);
    });
});

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

describe('operation without bundled CSS', () => {
    test('no stylesheet is loaded in the test harness', () => {
        const { document } = setup();

        assert.equal(document.querySelectorAll('link[rel="stylesheet"], style').length, 0);
    });

    test('initialization, click, keyboard, and selectTab() all resolve to the correct visible panel via the native hidden behavior alone', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.equal(dom.window.getComputedStyle(panels[0]).display, 'block');
        assert.equal(dom.window.getComputedStyle(panels[1]).display, 'none');

        click(buttons[1], dom);
        assert.equal(dom.window.getComputedStyle(panels[0]).display, 'none');
        assert.equal(dom.window.getComputedStyle(panels[1]).display, 'block');

        keydown(buttons[1], dom, 'ArrowRight');
        assert.equal(dom.window.getComputedStyle(panels[1]).display, 'none');
        assert.equal(dom.window.getComputedStyle(panels[2]).display, 'block');

        instance.selectTab(0);
        assert.equal(dom.window.getComputedStyle(panels[0]).display, 'block');
        assert.equal(dom.window.getComputedStyle(panels[2]).display, 'none');
    });
});

describe('swipeable', () => {
    test('disabled by default: touch does nothing', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        touch(panels[0], dom, 'touchstart', 200, 100);
        touch(panels[0], dom, 'touchend', 50, 105);

        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('when enabled, a horizontal swipe changes tabs and wraps at the edges', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs({ options: { swipeable: true } });
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        touch(panels[0], dom, 'touchstart', 200, 100);
        touch(panels[0], dom, 'touchend', 50, 105); // swipe left -> next
        assert.equal(instance.getSelectedIndex(), 1);

        touch(panels[1], dom, 'touchstart', 50, 100);
        touch(panels[1], dom, 'touchend', 200, 105); // swipe right -> previous
        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('a mostly-vertical or too-short drag is ignored', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs({ options: { swipeable: true } });
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        touch(panels[0], dom, 'touchstart', 100, 200);
        touch(panels[0], dom, 'touchend', 90, 20); // mostly vertical
        assert.equal(instance.getSelectedIndex(), 0);

        touch(panels[0], dom, 'touchstart', 100, 100);
        touch(panels[0], dom, 'touchend', 90, 100); // below threshold
        assert.equal(instance.getSelectedIndex(), 0);
    });
});
