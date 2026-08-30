const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { setup, CUSTOM_NAV_HTML } = require('./helpers/setup');

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
