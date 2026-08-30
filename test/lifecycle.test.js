const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { setup, click, touch, DEFAULT_HTML } = require('./helpers/setup');

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

    test('a swipe skips a disabled middle tab instead of throwing', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">Two</h3><div class="tab-panel__content">2</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title">Three</h3><div class="tab-panel__content">3</div></div>
            </div>
        </div>
        `;
        const { Tabs, dom, document } = setup(html);
        const instance = new Tabs({ options: { swipeable: true } });
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.doesNotThrow(() => {
            touch(panels[0], dom, 'touchstart', 200, 100);
            touch(panels[0], dom, 'touchend', 50, 105); // swipe left -> must skip disabled tab 1, land on 2
        });
        assert.equal(instance.getSelectedIndex(), 2);
    });

    test('a swipe wraps past a disabled edge to the other enabled end', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title">Two</h3><div class="tab-panel__content">2</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">Three</h3><div class="tab-panel__content">3</div></div>
            </div>
        </div>
        `;
        const { Tabs, dom, document } = setup(html);
        const instance = new Tabs({ options: { swipeable: true, initSelectedItem: 1 } });
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.doesNotThrow(() => {
            touch(panels[1], dom, 'touchstart', 200, 100);
            touch(panels[1], dom, 'touchend', 50, 105); // swipe left from Two -> must skip disabled Three, wrap to One
        });
        assert.equal(instance.getSelectedIndex(), 0);
    });
});
