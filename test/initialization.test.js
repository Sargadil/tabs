const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { setup, click, keydown, DEFAULT_HTML, CUSTOM_NAV_HTML } = require('./helpers/setup');

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
