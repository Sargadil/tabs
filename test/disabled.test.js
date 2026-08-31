const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { setup, click, keydown } = require('./helpers/setup');
const { customNavConfig, customNavHtml, tabsHtml } = require('./helpers/fixtures');

describe('disabled tabs', () => {
    const DISABLED_MIDDLE_HTML = tabsHtml(['One', { title: 'Two', disabled: true }, 'Three']);

    // First ("One") and last ("Four") disabled, so Home/End/wrap-around
    // all have to skip past a disabled edge to reach an enabled tab.
    const DISABLED_EDGES_HTML = tabsHtml([
        { title: 'One', disabled: true }, 'Two', 'Three', { title: 'Four', disabled: true },
    ]);

    const ALL_DISABLED_HTML = tabsHtml([
        { title: 'One', disabled: true }, { title: 'Two', disabled: true },
    ]);

    // Custom nav: a native disabled <button> and an aria-disabled <div>,
    // exercising both disabled mechanisms side by side.
    const CUSTOM_NAV_DISABLED_HTML = customNavHtml(
        ['Docs', { label: 'Support', disabled: true }, { label: 'Settings', tag: 'div', disabled: true }],
        ['Docs', 'Support', 'Settings'],
    );

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
