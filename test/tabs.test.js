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

    test('customNavTitles overrides the generated nav button text', () => {
        const { Tabs, document } = setup();
        new Tabs({ options: { customNavTitles: ['First', 'Second', 'Third'] } });

        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        assert.equal(buttons[0].textContent, 'First');
        assert.equal(buttons[1].textContent, 'Second');
        assert.equal(buttons[2].textContent, 'Third');
    });

    test('missing .tab-panel throws a friendly error', () => {
        const { Tabs } = setup('<div class="tabs" id="tabs"><div class="tabs__nav"></div><div class="tabs__panels"></div></div>');

        assert.throws(() => new Tabs(), /\[@sargadil\/tabs\] No tab panels were found/);
    });

    test('missing .tabs__nav throws a friendly error', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
            </div>
        </div>`;
        const { Tabs } = setup(html);

        assert.throws(() => new Tabs(), /\[@sargadil\/tabs\] Tab navigation container was not found/);
    });
});

describe('configuration validation', () => {
    test('all errors are prefixed with "[@sargadil/tabs]"', () => {
        const { Tabs } = setup();

        assert.throws(() => new Tabs({ contextID: 'does-not-exist' }), (err) => err.message.startsWith('[@sargadil/tabs] '));
    });

    test('invalid contextID type throws a friendly error', () => {
        const { Tabs } = setup();

        assert.throws(
            () => new Tabs({ contextID: 42 }),
            /\[@sargadil\/tabs\] "contextID" must be a string or an HTMLElement\. Received number\./
        );
    });

    test('contextID string with no matching element throws a friendly error', () => {
        const { Tabs } = setup();

        assert.throws(
            () => new Tabs({ contextID: 'does-not-exist' }),
            /\[@sargadil\/tabs\] Context element was not found\./
        );
    });

    test('invalid orientation throws a friendly error', () => {
        const { Tabs } = setup();

        assert.throws(
            () => new Tabs({ options: { orientation: 'diagonal' } }),
            /\[@sargadil\/tabs\] "orientation" must be "horizontal" or "vertical"\. Received "diagonal"\./
        );
    });

    test('invalid activationMode throws a friendly error', () => {
        const { Tabs } = setup();

        assert.throws(
            () => new Tabs({ options: { activationMode: 'eager' } }),
            /\[@sargadil\/tabs\] "activationMode" must be "automatic" or "manual"\. Received "eager"\./
        );
    });

    test('negative initSelectedItem throws a friendly error', () => {
        const { Tabs } = setup();

        assert.throws(
            () => new Tabs({ options: { initSelectedItem: -1 } }),
            /\[@sargadil\/tabs\] "initSelectedItem" must be an integer >= 0\. Received -1\./
        );
    });

    test('float initSelectedItem throws a friendly error', () => {
        const { Tabs } = setup();

        assert.throws(
            () => new Tabs({ options: { initSelectedItem: 1.5 } }),
            /\[@sargadil\/tabs\] "initSelectedItem" must be an integer >= 0\. Received 1\.5\./
        );
    });

    test('out-of-range initSelectedItem throws a friendly error naming the field and count', () => {
        const { Tabs } = setup();

        assert.throws(
            () => new Tabs({ options: { initSelectedItem: 5 } }),
            /\[@sargadil\/tabs\] initSelectedItem 5 is out of range\. Found 3 tabs\./
        );
    });

    test('valid initSelectedItem at the last index does not throw', () => {
        const { Tabs } = setup();

        assert.doesNotThrow(() => new Tabs({ options: { initSelectedItem: 2 } }));
    });

    test('missing tab panels throws a friendly error naming the selector', () => {
        const { Tabs } = setup('<div class="tabs" id="tabs"><div class="tabs__nav"></div><div class="tabs__panels"></div></div>');

        assert.throws(
            () => new Tabs(),
            /\[@sargadil\/tabs\] No tab panels were found\. Expected at least one element matching "\.tab-panel"\./
        );
    });

    test('missing required tab panel title throws a friendly error', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><div class="tab-panel__content">2</div></div>
            </div>
        </div>`;
        const { Tabs } = setup(html);

        assert.throws(
            () => new Tabs(),
            /\[@sargadil\/tabs\] Expected 2 tab panel title\(s\) matching "\.tab-panel__title" \(one per panel\) but found 1\./
        );
    });

    test('missing required tab panel title still throws even when customNavTitles is provided', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><div class="tab-panel__content">2</div></div>
            </div>
        </div>`;
        const { Tabs } = setup(html);

        assert.throws(
            () => new Tabs({ options: { customNavTitles: ['One', 'Two'] } }),
            /\[@sargadil\/tabs\] Expected 2 tab panel title\(s\)/
        );
    });

    test('missing custom navigation elements throws a friendly error', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="custom-tabs__nav">
                <div class="custom-tabs__nav-inner"></div>
            </div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
            </div>
        </div>`;
        const { Tabs } = setup(html);

        assert.throws(
            () => new Tabs({
                classes: {
                    tabsNavContainer: '.custom-tabs__nav',
                    tabsNavList: '.custom-tabs__nav-inner',
                    tabsNavButton: '.custom-tabs__nav-button',
                },
                options: { useCustomNav: true },
            }),
            /\[@sargadil\/tabs\] No custom navigation elements were found\./
        );
    });

    test('matching custom navigation/panel counts do not throw', () => {
        const { Tabs } = setup(CUSTOM_NAV_HTML); // 2 custom nav buttons, 2 panels

        assert.doesNotThrow(() => new Tabs({
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true },
        }));
    });

    test('custom navigation/panel count mismatch throws a friendly error', () => {
        const html = `
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
                <div class="tab-panel"><h3 class="tab-panel__title">Three</h3><div class="tab-panel__content">3</div></div>
            </div>
        </div>`;
        const { Tabs } = setup(html); // 2 custom nav buttons, 3 panels

        assert.throws(
            () => new Tabs({
                classes: {
                    tabsNavContainer: '.custom-tabs__nav',
                    tabsNavList: '.custom-tabs__nav-inner',
                    tabsNavButton: '.custom-tabs__nav-button',
                },
                options: { useCustomNav: true },
            }),
            /\[@sargadil\/tabs\] Custom navigation has 2 tab\(s\) but there are 3 panel\(s\)\. The counts must match\./
        );
    });

    test('a valid configuration keeps working (no accidental over-validation)', () => {
        const { Tabs, document } = setup();
        const instance = new Tabs({
            options: { orientation: 'vertical', activationMode: 'manual', initSelectedItem: 1 },
        });

        assert.equal(instance.getSelectedIndex(), 1);
        assert.equal(document.querySelector('[role="tablist"]').getAttribute('aria-orientation'), 'vertical');
    });
});

describe('form submission safety', () => {
    function withForm(html) {
        return `<form id="host-form">${html}</form>`;
    }

    test('generated tab buttons have type="button"', () => {
        const { Tabs, document } = setup();
        new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        buttons.forEach((button) => assert.equal(button.getAttribute('type'), 'button'));
    });

    test('clicking a generated tab inside a <form> does not submit it', () => {
        const { Tabs, dom, document } = setup(withForm(DEFAULT_HTML));
        new Tabs();
        const form = document.getElementById('host-form');
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        let submitted = false;

        form.addEventListener('submit', (event) => {
            submitted = true;
            event.preventDefault();
        });

        click(buttons[1], dom);

        assert.equal(submitted, false);
    });

    test('clicking a custom-nav tab inside a <form> does not submit it', () => {
        const { Tabs, dom, document } = setup(withForm(CUSTOM_NAV_HTML));
        new Tabs({
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true },
        });
        const form = document.getElementById('host-form');
        const buttons = document.querySelectorAll('.custom-tabs__nav-button');
        let submitted = false;

        form.addEventListener('submit', (event) => {
            submitted = true;
            event.preventDefault();
        });

        click(buttons[1], dom);

        assert.equal(submitted, false);
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

    test('gives a <button> without an explicit type a type="button"', () => {
        const { Tabs, document } = setup(CUSTOM_NAV_HTML);
        new Tabs({
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true },
        });

        const buttons = document.querySelectorAll('.custom-tabs__nav-button');

        assert.equal(buttons[0].getAttribute('type'), 'button');
        assert.equal(buttons[1].getAttribute('type'), 'button');
    });

    test('leaves an explicit type on a custom <button> untouched', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="custom-tabs__nav">
                <div class="custom-tabs__nav-inner">
                    <button class="custom-tabs__nav-button" role="tab" type="submit">Tab 1</button>
                    <button class="custom-tabs__nav-button" role="tab">Tab 2</button>
                </div>
            </div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title">Two</h3><div class="tab-panel__content">2</div></div>
            </div>
        </div>`;
        const { Tabs, document } = setup(html);
        new Tabs({
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true },
        });

        const buttons = document.querySelectorAll('.custom-tabs__nav-button');

        assert.equal(buttons[0].getAttribute('type'), 'submit', 'explicit type must not be overwritten');
        assert.equal(buttons[1].getAttribute('type'), 'button');
    });

    test('does not set a type attribute on a non-button custom nav element', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="custom-tabs__nav">
                <div class="custom-tabs__nav-inner">
                    <div class="custom-tabs__nav-button" role="tab" tabindex="0">Tab 1</div>
                    <div class="custom-tabs__nav-button" role="tab" tabindex="-1">Tab 2</div>
                </div>
            </div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title">Two</h3><div class="tab-panel__content">2</div></div>
            </div>
        </div>`;
        const { Tabs, document } = setup(html);
        new Tabs({
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true },
        });

        const items = document.querySelectorAll('.custom-tabs__nav-button');

        assert.equal(items[0].hasAttribute('type'), false);
        assert.equal(items[1].hasAttribute('type'), false);
    });

    test('ariaLabel and vertical orientation are applied to the custom tablist container too', () => {
        const { Tabs, document } = setup(CUSTOM_NAV_HTML);
        new Tabs({
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true, ariaLabel: 'Sections', orientation: 'vertical' },
        });

        const tablist = document.querySelector('.custom-tabs__nav-inner');

        assert.equal(tablist.getAttribute('aria-label'), 'Sections');
        assert.equal(tablist.getAttribute('aria-orientation'), 'vertical');
    });
});

describe('removeTabPanelTitle option', () => {
    test('default (false): title elements stay in the panel', () => {
        const { Tabs, document } = setup();
        new Tabs();

        const titles = document.querySelectorAll('.tab-panel__title');

        assert.equal(titles.length, 3);
    });

    test('true: title elements are removed from every panel after nav generation', () => {
        const { Tabs, document } = setup();
        new Tabs({ options: { removeTabPanelTitle: true } });

        const titles = document.querySelectorAll('.tab-panel__title');
        const panels = document.querySelectorAll('.tab-panel');

        assert.equal(titles.length, 0);
        assert.equal(panels.length, 3, 'the panels themselves must survive, only the title inside is removed');
    });

    test('true: nav buttons still get the title text, since removal happens after nav generation', () => {
        // jsdom does not implement `innerText` (the title-text fallback used when no
        // `data-nav-title` is set), so this exercises the `data-nav-title` path — the
        // `innerText` fallback itself is covered in a real browser, see
        // e2e/public-api.spec.js.
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="One">First panel title</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="Two">Second panel title</h3><div class="tab-panel__content">2</div></div>
            </div>
        </div>`;
        const { Tabs, document } = setup(html);
        new Tabs({ options: { removeTabPanelTitle: true } });

        const buttons = document.querySelectorAll('[role="tab"]');

        assert.equal(buttons[0].textContent, 'One');
        assert.equal(buttons[1].textContent, 'Two');
    });

    test('true: panel content other than the title is left untouched', () => {
        const { Tabs, document } = setup();
        new Tabs({ options: { removeTabPanelTitle: true } });

        const content = document.querySelectorAll('.tab-panel__content');

        assert.equal(content.length, 3);
        assert.equal(content[0].textContent, '1');
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

    test('ArrowLeft selects the previous tab, wrapping from the first tab to the last', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        click(buttons[1], dom);
        keydown(buttons[1], dom, 'ArrowLeft');
        assert.equal(instance.getSelectedIndex(), 0, 'ArrowLeft from tab 1 selects tab 0');

        keydown(buttons[0], dom, 'ArrowLeft');
        assert.equal(instance.getSelectedIndex(), 2, 'ArrowLeft from the first tab wraps to the last');
    });

    test('ArrowRight wraps from the last tab back to the first', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        click(buttons[2], dom);
        keydown(buttons[2], dom, 'ArrowRight');
        assert.equal(instance.getSelectedIndex(), 0, 'ArrowRight from the last tab wraps to the first');
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

    test('ArrowLeft moves focus to the previous tab, wrapping at the start, without selecting', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs({ options: { activationMode: 'manual' } });
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowLeft');
        assert.equal(document.activeElement, buttons[2], 'ArrowLeft from the first tab wraps focus to the last');
        assert.equal(instance.getSelectedIndex(), 0, 'focus move alone must not select');

        keydown(buttons[2], dom, 'ArrowLeft');
        assert.equal(document.activeElement, buttons[1]);
        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('Home/End move focus to the first/last tab without selecting', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs({ options: { activationMode: 'manual' } });
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'End');
        assert.equal(document.activeElement, buttons[2]);
        assert.equal(instance.getSelectedIndex(), 0, 'focus move alone must not select');

        keydown(buttons[2], dom, 'Home');
        assert.equal(document.activeElement, buttons[0]);
        assert.equal(instance.getSelectedIndex(), 0);
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

    test('destroy() also removes touch listeners when swipeable is enabled', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs({ options: { swipeable: true } });
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        instance.destroy();
        touch(panels[0], dom, 'touchstart', 200, 100);
        touch(panels[0], dom, 'touchend', 50, 105); // would swipe to the next tab if still wired up

        assert.equal(instance.getSelectedIndex(), 0, 'swipe after destroy() must be inert');
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

describe('RTL keyboard navigation', () => {
    const LOCAL_RTL_HTML = `
    <div dir="rtl">
        ${DEFAULT_HTML}
    </div>
    `;

    function setupDocumentDir(dir, html = DEFAULT_HTML) {
        const { Tabs, dom, document } = setup(html);
        document.documentElement.setAttribute('dir', dir);
        return { Tabs, dom, document };
    }

    test('LTR (default): ArrowRight selects next, ArrowLeft selects previous, automatic mode', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowRight');
        assert.equal(instance.getSelectedIndex(), 1, 'ArrowRight moves to next tab in LTR');

        keydown(buttons[1], dom, 'ArrowLeft');
        assert.equal(instance.getSelectedIndex(), 0, 'ArrowLeft moves to previous tab in LTR');
    });

    test('LTR (default): ArrowRight moves focus without selecting, manual mode', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs({ options: { activationMode: 'manual' } });
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowRight');
        assert.equal(document.activeElement, buttons[1], 'ArrowRight moves focus to next tab in LTR');
        assert.equal(instance.getSelectedIndex(), 0, 'focus move alone must not select');
    });

    test('<html dir="rtl">: ArrowLeft selects next, ArrowRight selects previous, automatic mode', () => {
        const { Tabs, dom, document } = setupDocumentDir('rtl');
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowLeft');
        assert.equal(instance.getSelectedIndex(), 1, 'ArrowLeft moves to next tab in RTL');

        keydown(buttons[1], dom, 'ArrowRight');
        assert.equal(instance.getSelectedIndex(), 0, 'ArrowRight moves to previous tab in RTL');
    });

    test('<html dir="rtl">: ArrowLeft moves focus without selecting, manual mode', () => {
        const { Tabs, dom, document } = setupDocumentDir('rtl');
        const instance = new Tabs({ options: { activationMode: 'manual' } });
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowLeft');
        assert.equal(document.activeElement, buttons[1], 'ArrowLeft moves focus to next tab in RTL');
        assert.equal(instance.getSelectedIndex(), 0, 'focus move alone must not select');

        keydown(buttons[1], dom, 'ArrowRight');
        assert.equal(document.activeElement, buttons[0], 'ArrowRight moves focus back to previous tab in RTL');
        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('a local dir="rtl" wrapper (not <html>) also reverses horizontal arrows', () => {
        const { Tabs, dom, document } = setup(LOCAL_RTL_HTML);
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowLeft');
        assert.equal(instance.getSelectedIndex(), 1, 'ArrowLeft moves to next tab under a local dir="rtl" ancestor');
    });

    test('RTL wrap-around: ArrowLeft wraps from the last tab to the first, ArrowRight wraps from the first to the last', () => {
        const { Tabs, dom, document } = setupDocumentDir('rtl');
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowRight');
        assert.equal(instance.getSelectedIndex(), 2, 'ArrowRight from the first tab wraps to the last in RTL');

        keydown(buttons[2], dom, 'ArrowLeft');
        assert.equal(instance.getSelectedIndex(), 0, 'ArrowLeft from the last tab wraps to the first in RTL');
    });

    test('RTL: Home selects the first tab, End selects the last tab (unaffected by direction)', () => {
        const { Tabs, dom, document } = setupDocumentDir('rtl');
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'End');
        assert.equal(instance.getSelectedIndex(), 2);

        keydown(buttons[2], dom, 'Home');
        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('RTL + vertical orientation: ArrowUp/ArrowDown behavior is unchanged', () => {
        const { Tabs, dom, document } = setupDocumentDir('rtl');
        const instance = new Tabs({ options: { orientation: 'vertical' } });
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        keydown(buttons[0], dom, 'ArrowDown');
        assert.equal(instance.getSelectedIndex(), 1, 'ArrowDown still selects the next tab in RTL vertical mode');

        keydown(buttons[1], dom, 'ArrowUp');
        assert.equal(instance.getSelectedIndex(), 0, 'ArrowUp still selects the previous tab in RTL vertical mode');

        keydown(buttons[0], dom, 'ArrowLeft');
        assert.equal(instance.getSelectedIndex(), 0, 'ArrowLeft/ArrowRight remain ignored in vertical mode, even in RTL');
    });
});

describe('RTL + disabled tabs interaction', () => {
    // First ("One") and last ("Four") disabled, same shape as DISABLED_EDGES_HTML in the
    // "disabled tabs" suite, so Home/End/wrap-around all have to skip past a disabled edge
    // to reach an enabled tab — now combined with a reversed RTL key mapping.
    const RTL_DISABLED_EDGES_HTML = `
    <div class="tabs" id="tabs">
        <div class="tabs__nav"></div>
        <div class="tabs__panels">
            <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">One</h3><div class="tab-panel__content">1</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title">Two</h3><div class="tab-panel__content">2</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title">Three</h3><div class="tab-panel__content">3</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">Four</h3><div class="tab-panel__content">4</div></div>
        </div>
    </div>
    `;

    function setupRTLDisabled(options = {}) {
        const { Tabs, dom, document } = setup(RTL_DISABLED_EDGES_HTML);
        document.documentElement.setAttribute('dir', 'rtl');
        const instance = new Tabs({ options: { initSelectedItem: 1, ...options } });
        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        return { instance, dom, document, buttons };
    }

    test('automatic mode: ArrowLeft (next in RTL) and ArrowRight (previous in RTL) both skip disabled edges, wrapping around', () => {
        const { instance, dom, buttons } = setupRTLDisabled();

        keydown(buttons[1], dom, 'ArrowLeft'); // RTL "next": 1 -> 2 (Three)
        assert.equal(instance.getSelectedIndex(), 2, 'ArrowLeft from Two must select Three in RTL');

        keydown(buttons[2], dom, 'ArrowLeft'); // RTL "next": 2 -> skip disabled 3, wrap, skip disabled 0, land on 1
        assert.equal(instance.getSelectedIndex(), 1, 'ArrowLeft from Three must wrap past both disabled edges to Two in RTL');

        keydown(buttons[1], dom, 'ArrowRight'); // RTL "previous": 1 -> skip disabled 0, wrap, skip disabled 3, land on 2
        assert.equal(instance.getSelectedIndex(), 2, 'ArrowRight from Two must wrap past both disabled edges to Three in RTL');
    });

    test('automatic mode: Home/End skip disabled edges under RTL (unaffected by direction)', () => {
        const { instance, dom, buttons } = setupRTLDisabled();

        keydown(buttons[1], dom, 'Home');
        assert.equal(instance.getSelectedIndex(), 1, 'Home must skip disabled tab 0 and land on Two, even under RTL');

        keydown(buttons[1], dom, 'End');
        assert.equal(instance.getSelectedIndex(), 2, 'End must skip disabled tab 3 and land on Three, even under RTL');
    });

    test('manual mode: ArrowLeft/ArrowRight move focus (not selection) past disabled edges under RTL', () => {
        const { instance, dom, document, buttons } = setupRTLDisabled({ activationMode: 'manual' });

        keydown(buttons[1], dom, 'ArrowLeft'); // RTL "next": focus 1 -> 2
        assert.equal(document.activeElement, buttons[2], 'ArrowLeft must move focus to Three in RTL manual mode');
        assert.equal(instance.getSelectedIndex(), 1, 'focus move alone must not select');

        keydown(buttons[2], dom, 'ArrowLeft'); // RTL "next": focus 2 -> skip disabled 3, wrap, skip disabled 0, land on 1
        assert.equal(document.activeElement, buttons[1], 'ArrowLeft must wrap past both disabled edges to Two in RTL manual mode');
        assert.equal(instance.getSelectedIndex(), 1, 'still only the initial tab is selected');
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

    test('when enabled, a horizontal swipe changes tabs (left selects next, right selects previous)', () => {
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

    test('swipe wraps at the edges', () => {
        const { Tabs, dom, document } = setup();
        const instance = new Tabs({ options: { swipeable: true } });
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        instance.selectTab(2); // last tab
        touch(panels[2], dom, 'touchstart', 200, 100);
        touch(panels[2], dom, 'touchend', 50, 105); // swipe left -> next, wraps to first
        assert.equal(instance.getSelectedIndex(), 0);

        touch(panels[0], dom, 'touchstart', 50, 100);
        touch(panels[0], dom, 'touchend', 200, 105); // swipe right -> previous, wraps to last
        assert.equal(instance.getSelectedIndex(), 2);
    });
});

describe('disabled tabs', () => {
    const DISABLED_MIDDLE_HTML = `
    <div class="tabs" id="tabs">
        <div class="tabs__nav"></div>
        <div class="tabs__panels">
            <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">Two</h3><div class="tab-panel__content">2</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title">Three</h3><div class="tab-panel__content">3</div></div>
        </div>
    </div>
    `;

    // First ("One") and last ("Four") disabled, so Home/End/wrap-around
    // all have to skip past a disabled edge to reach an enabled tab.
    const DISABLED_EDGES_HTML = `
    <div class="tabs" id="tabs">
        <div class="tabs__nav"></div>
        <div class="tabs__panels">
            <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">One</h3><div class="tab-panel__content">1</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title">Two</h3><div class="tab-panel__content">2</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title">Three</h3><div class="tab-panel__content">3</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">Four</h3><div class="tab-panel__content">4</div></div>
        </div>
    </div>
    `;

    const ALL_DISABLED_HTML = `
    <div class="tabs" id="tabs">
        <div class="tabs__nav"></div>
        <div class="tabs__panels">
            <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">One</h3><div class="tab-panel__content">1</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">Two</h3><div class="tab-panel__content">2</div></div>
        </div>
    </div>
    `;

    // Custom nav: a native disabled <button> and an aria-disabled <div>,
    // exercising both disabled mechanisms side by side.
    const CUSTOM_NAV_DISABLED_HTML = `
    <div class="tabs" id="tabs">
        <div class="custom-tabs__nav">
            <div class="custom-tabs__nav-inner">
                <button class="custom-tabs__nav-button" role="tab">Docs</button>
                <button class="custom-tabs__nav-button" role="tab" disabled>Support</button>
                <div class="custom-tabs__nav-button" role="tab" tabindex="-1" aria-disabled="true">Settings</div>
            </div>
        </div>
        <div class="tabs__panels">
            <div class="tab-panel"><h3 class="tab-panel__title">Docs</h3><div class="tab-panel__content">1</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title">Support</h3><div class="tab-panel__content">2</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title">Settings</h3><div class="tab-panel__content">3</div></div>
        </div>
    </div>
    `;

    function customNavConfig(extra = {}) {
        return {
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true, ...extra },
        };
    }

    describe('default nav: aria-disabled on the title becomes a native disabled button', () => {
        test('a title with aria-disabled="true" produces <button disabled>', () => {
            const { Tabs, document } = setup(DISABLED_MIDDLE_HTML);
            new Tabs();
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            assert.equal(buttons[0].disabled, false);
            assert.equal(buttons[1].disabled, true);
            assert.equal(buttons[2].disabled, false);
        });
    });

    describe('constructor validation', () => {
        test('initSelectedItem pointing at a disabled tab throws a friendly error', () => {
            const { Tabs } = setup(DISABLED_MIDDLE_HTML);

            assert.throws(
                () => new Tabs({ options: { initSelectedItem: 1 } }),
                /\[@sargadil\/tabs\] initSelectedItem 1 is disabled\. Choose an enabled tab as the initial tab\./
            );
        });

        test('a disabled initSelectedItem in custom nav also throws', () => {
            const { Tabs } = setup(CUSTOM_NAV_DISABLED_HTML);

            assert.throws(
                () => new Tabs(customNavConfig({ initSelectedItem: 1 })),
                /\[@sargadil\/tabs\] initSelectedItem 1 is disabled\./
            );
        });

        test('all tabs disabled throws a friendly error', () => {
            const { Tabs } = setup(ALL_DISABLED_HTML);

            assert.throws(
                () => new Tabs(),
                /\[@sargadil\/tabs\] At least one enabled tab is required\./
            );
        });

        test('an enabled initSelectedItem alongside disabled tabs does not throw', () => {
            const { Tabs, document } = setup(DISABLED_MIDDLE_HTML);

            assert.doesNotThrow(() => new Tabs());

            const buttons = document.querySelectorAll('#tabs [role="tab"]');
            assert.equal(buttons[0].getAttribute('aria-selected'), 'true');
        });
    });

    describe('selectTab()', () => {
        test('throws a friendly error when selecting a disabled tab, and state is unchanged', () => {
            const { Tabs, document } = setup(DISABLED_MIDDLE_HTML);
            const instance = new Tabs();
            const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

            assert.throws(
                () => instance.selectTab(1),
                /\[@sargadil\/tabs\] Cannot select disabled tab at index 1\./
            );
            assert.equal(instance.getSelectedIndex(), 0);
            assert.equal(panels[0].hidden, false);
        });

        test('throws for a disabled custom-nav tab, whether native disabled or aria-disabled', () => {
            const { Tabs } = setup(CUSTOM_NAV_DISABLED_HTML);
            const instance = new Tabs(customNavConfig());

            assert.throws(() => instance.selectTab(1), /Cannot select disabled tab at index 1\./);
            assert.throws(() => instance.selectTab(2), /Cannot select disabled tab at index 2\./);
        });

        test('still selects an enabled tab normally', () => {
            const { Tabs } = setup(DISABLED_MIDDLE_HTML);
            const instance = new Tabs();

            instance.selectTab(2);
            assert.equal(instance.getSelectedIndex(), 2);
        });
    });

    describe('click', () => {
        test('clicking a disabled generated tab does not select it', () => {
            const { Tabs, dom, document } = setup(DISABLED_MIDDLE_HTML);
            const instance = new Tabs();
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            click(buttons[1], dom);

            assert.equal(instance.getSelectedIndex(), 0);
        });

        test('clicking a disabled custom-nav tab (native disabled or aria-disabled) does not select it', () => {
            const { Tabs, dom, document } = setup(CUSTOM_NAV_DISABLED_HTML);
            const instance = new Tabs(customNavConfig());
            const buttons = document.querySelectorAll('.custom-tabs__nav-button');

            click(buttons[1], dom); // native disabled <button>
            assert.equal(instance.getSelectedIndex(), 0);

            click(buttons[2], dom); // aria-disabled <div>
            assert.equal(instance.getSelectedIndex(), 0);
        });

        test('does not dispatch tabs:beforechange for a click blocked by disabled', () => {
            const { Tabs, dom, document } = setup(DISABLED_MIDDLE_HTML);
            new Tabs();
            const container = document.getElementById('tabs');
            const buttons = document.querySelectorAll('#tabs [role="tab"]');
            let before_change_fired = false;

            container.addEventListener('tabs:beforechange', () => { before_change_fired = true; });

            click(buttons[1], dom);

            assert.equal(before_change_fired, false, 'the disabled check must short-circuit before tabs:beforechange is dispatched');
        });
    });

    describe('automatic mode: arrow keys and Home/End skip disabled tabs', () => {
        test('ArrowRight skips a disabled middle tab', () => {
            const { Tabs, dom, document } = setup(DISABLED_MIDDLE_HTML);
            const instance = new Tabs();
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            click(buttons[0], dom);
            keydown(buttons[0], dom, 'ArrowRight');

            assert.equal(instance.getSelectedIndex(), 2, 'ArrowRight from tab 0 must skip disabled tab 1 and land on tab 2');
        });

        test('ArrowLeft skips a disabled middle tab', () => {
            const { Tabs, dom, document } = setup(DISABLED_MIDDLE_HTML);
            const instance = new Tabs({ options: { initSelectedItem: 2 } });
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            click(buttons[2], dom);
            keydown(buttons[2], dom, 'ArrowLeft');

            assert.equal(instance.getSelectedIndex(), 0, 'ArrowLeft from tab 2 must skip disabled tab 1 and land on tab 0');
        });

        test('Home skips a disabled first tab; End skips a disabled last tab', () => {
            const { Tabs, dom, document } = setup(DISABLED_EDGES_HTML);
            const instance = new Tabs({ options: { initSelectedItem: 1 } });
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            click(buttons[2], dom);
            keydown(buttons[2], dom, 'Home');
            assert.equal(instance.getSelectedIndex(), 1, 'Home must skip disabled tab 0 and land on tab 1');

            keydown(buttons[1], dom, 'End');
            assert.equal(instance.getSelectedIndex(), 2, 'End must skip disabled tab 3 and land on tab 2');
        });

        test('ArrowRight/ArrowLeft wrap around disabled edges to the other enabled end', () => {
            const { Tabs, dom, document } = setup(DISABLED_EDGES_HTML);
            const instance = new Tabs({ options: { initSelectedItem: 1 } });
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            click(buttons[2], dom);
            keydown(buttons[2], dom, 'ArrowRight'); // wraps past disabled 3, disabled 0, lands on enabled 1
            assert.equal(instance.getSelectedIndex(), 1);

            keydown(buttons[1], dom, 'ArrowLeft'); // wraps past disabled 0, disabled 3, lands on enabled 2
            assert.equal(instance.getSelectedIndex(), 2);
        });
    });

    describe('manual mode: focus movement and activation skip disabled tabs', () => {
        test('ArrowRight moves focus past a disabled tab without selecting', () => {
            const { Tabs, dom, document } = setup(DISABLED_MIDDLE_HTML);
            const instance = new Tabs({ options: { activationMode: 'manual' } });
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            keydown(buttons[0], dom, 'ArrowRight');

            assert.equal(document.activeElement, buttons[2], 'focus must skip disabled tab 1');
            assert.equal(instance.getSelectedIndex(), 0, 'focus move alone must not select');
        });

        test('Home/End move focus past disabled edges without selecting', () => {
            const { Tabs, dom, document } = setup(DISABLED_EDGES_HTML);
            const instance = new Tabs({ options: { activationMode: 'manual', initSelectedItem: 1 } });
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            keydown(buttons[1], dom, 'End');
            assert.equal(document.activeElement, buttons[2], 'End must skip disabled tab 3');
            assert.equal(instance.getSelectedIndex(), 1);

            keydown(buttons[2], dom, 'Home');
            assert.equal(document.activeElement, buttons[1], 'Home must skip disabled tab 0');
            assert.equal(instance.getSelectedIndex(), 1);
        });

        test('clicking a disabled tab in manual mode does not activate it', () => {
            const { Tabs, dom, document } = setup(DISABLED_MIDDLE_HTML);
            const instance = new Tabs({ options: { activationMode: 'manual' } });
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            click(buttons[1], dom);

            assert.equal(instance.getSelectedIndex(), 0);
        });
    });

    describe('defensive: a keydown that reaches a disabled tab directly is inert', () => {
        test('ArrowRight dispatched on a disabled custom-nav tab does not navigate', () => {
            // A native disabled <button> cannot receive focus/keyboard events at all, so
            // this only matters for a custom aria-disabled element a misconfigured page
            // left focusable (e.g. tabindex="0"). Dispatching directly on it here
            // simulates that instead of relying on real focus restrictions.
            const { Tabs, dom, document } = setup(CUSTOM_NAV_DISABLED_HTML);
            const instance = new Tabs(customNavConfig());
            const buttons = document.querySelectorAll('.custom-tabs__nav-button');

            keydown(buttons[2], dom, 'ArrowRight');

            assert.equal(instance.getSelectedIndex(), 0, 'a keydown on a disabled tab must not select another tab');
            assert.equal(document.activeElement, document.body, 'focus must not move to another tab either');
        });
    });

    describe('roving tabindex with disabled tabs present', () => {
        test('exactly one tab keeps tabIndex 0, and it is never a disabled tab', () => {
            const { Tabs, dom, document } = setup(DISABLED_MIDDLE_HTML);
            new Tabs();
            const buttons = document.querySelectorAll('#tabs [role="tab"]');

            click(buttons[0], dom);
            keydown(buttons[0], dom, 'ArrowRight'); // skips disabled 1, selects 2

            const zero_indexed = Array.from(buttons).filter((b) => b.tabIndex === 0);
            assert.equal(zero_indexed.length, 1);
            assert.equal(zero_indexed[0], buttons[2]);
        });
    });
});
