const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { setup, click, keydown, DEFAULT_HTML } = require('./helpers/setup');

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
