const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { setup, click, DEFAULT_HTML, CUSTOM_NAV_HTML } = require('./helpers/setup');

describe('refresh()', () => {
    // Titles carry data-nav-title so the generated button text is readable in
    // jsdom, which has no innerText (same reason as the removeTabPanelTitle suite).
    const REFRESH_HTML = `
    <div class="tabs" id="tabs">
        <div class="tabs__nav"></div>
        <div class="tabs__panels">
            <div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="One">One</h3><div class="tab-panel__content">1</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="Two">Two</h3><div class="tab-panel__content">2</div></div>
            <div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="Three">Three</h3><div class="tab-panel__content">3</div></div>
        </div>
    </div>`;

    function refreshSetup() {
        return setup(REFRESH_HTML);
    }

    function panelMarkup(title, content, { disabled = false } = {}) {
        const disabled_attr = disabled ? ' aria-disabled="true"' : '';
        return `<div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="${title}"${disabled_attr}>${title}</h3><div class="tab-panel__content">${content}</div></div>`;
    }

    function panelsContainer(document) {
        return document.querySelector('#tabs .tabs__panels');
    }

    function addPanel(document, title, content, options) {
        panelsContainer(document).insertAdjacentHTML('beforeend', panelMarkup(title, content, options));
    }

    function tabTexts(document) {
        return Array.from(document.querySelectorAll('#tabs [role="tab"]')).map((b) => b.textContent);
    }

    test('detects a newly added panel and wires a working tab for it', () => {
        const { Tabs, dom, document } = refreshSetup();
        const instance = new Tabs();

        addPanel(document, 'Four', '4');
        instance.refresh();

        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.equal(buttons.length, 4);
        assert.equal(panels.length, 4);
        assert.deepEqual(tabTexts(document), ['One', 'Two', 'Three', 'Four']);

        // the new panel got the full ARIA/DOM contract
        assert.equal(panels[3].getAttribute('role'), 'tabpanel');
        assert.ok(panels[3].id);
        assert.equal(panels[3].hidden, true);
        assert.equal(buttons[3].getAttribute('aria-controls'), panels[3].id);
        assert.equal(panels[3].getAttribute('aria-labelledby'), buttons[3].id);

        // and it actually works
        click(buttons[3], dom);
        assert.equal(instance.getSelectedIndex(), 3);
        assert.equal(panels[3].hidden, false);
    });

    test('preserves the active tab across a refresh when its panel still exists', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        instance.selectTab(2);
        addPanel(document, 'Four', '4');
        instance.refresh();

        assert.equal(instance.getSelectedIndex(), 2);
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');
        assert.equal(panels[2].hidden, false);
        assert.equal(panels[0].hidden, true);
    });

    test('removing an inactive panel drops it from state and keeps the active tab', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        instance.selectTab(0);
        document.querySelectorAll('#tabs .tab-panel')[2].remove(); // remove inactive "Three"
        instance.refresh();

        assert.equal(document.querySelectorAll('#tabs [role="tab"]').length, 2);
        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('removing the active middle panel activates the tab that took its place', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        instance.selectTab(1); // "Two" active
        document.querySelectorAll('#tabs .tab-panel')[1].remove(); // remove active "Two"
        instance.refresh();

        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        assert.equal(buttons.length, 2);
        assert.equal(instance.getSelectedIndex(), 1, 'the old "Three", now at index 1, becomes active');
        assert.equal(buttons[1].textContent, 'Three');
        assert.equal(panels[1].hidden, false);
        assert.equal(panels[0].hidden, true);
    });

    test('removing the active last panel falls back to the new last tab', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        instance.selectTab(2); // last active
        document.querySelectorAll('#tabs .tab-panel')[2].remove();
        instance.refresh();

        assert.equal(instance.getSelectedIndex(), 1, 'previous tab becomes active when the removed one was last');
        assert.equal(document.querySelectorAll('#tabs [role="tabpanel"]')[1].hidden, false);
    });

    test('repeated refresh() calls never duplicate event listeners', () => {
        const { Tabs, dom, document } = refreshSetup();
        const instance = new Tabs();
        const container = document.getElementById('tabs');

        let before_count = 0;
        let change_count = 0;
        container.addEventListener('tabs:beforechange', () => { before_count++; });
        container.addEventListener('tabs:change', () => { change_count++; });

        instance.refresh();
        instance.refresh();
        instance.refresh();

        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        click(buttons[1], dom);

        assert.equal(before_count, 1, 'tabs:beforechange must fire exactly once per switch, not once per past refresh()');
        assert.equal(change_count, 1, 'tabs:change must fire exactly once per switch');
        assert.equal(instance.getSelectedIndex(), 1);
    });

    test('repeated refresh() on custom nav does not double-bind the surviving buttons', () => {
        const { Tabs, dom, document } = setup(CUSTOM_NAV_HTML);
        const config = {
            classes: {
                tabsNavContainer: '.custom-tabs__nav',
                tabsNavList: '.custom-tabs__nav-inner',
                tabsNavButton: '.custom-tabs__nav-button',
            },
            options: { useCustomNav: true },
        };
        const instance = new Tabs(config);
        const container = document.getElementById('tabs');

        let change_count = 0;
        container.addEventListener('tabs:change', () => { change_count++; });

        instance.refresh();
        instance.refresh();

        const buttons = document.querySelectorAll('.custom-tabs__nav-button');
        click(buttons[1], dom);

        assert.equal(change_count, 1);
        assert.equal(instance.getSelectedIndex(), 1);
    });

    test('a removed panel/tab stops responding (its listeners are gone)', () => {
        const { Tabs, dom, document } = refreshSetup();
        const instance = new Tabs();

        const removedButton = document.querySelectorAll('#tabs [role="tab"]')[2];
        document.querySelectorAll('#tabs .tab-panel')[2].remove();
        instance.refresh();

        // the detached old button must no longer drive the instance
        click(removedButton, dom);
        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('synchronizes a tab that became disabled after construction', () => {
        const { Tabs, dom, document } = refreshSetup();
        const instance = new Tabs();

        // disable the currently-active first tab
        document.querySelectorAll('#tabs .tab-panel__title')[0].setAttribute('aria-disabled', 'true');
        instance.refresh();

        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        assert.equal(buttons[0].disabled, true, 'the generated button reflects the new disabled state');
        assert.notEqual(instance.getSelectedIndex(), 0, 'selection moves off the now-disabled tab');
        assert.equal(instance.getSelectedIndex(), 1);

        click(buttons[0], dom);
        assert.equal(instance.getSelectedIndex(), 1, 'the disabled tab no longer activates on click');
    });

    test('when the active last tab becomes disabled, selection wraps to the first enabled tab', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        instance.selectTab(2);
        document.querySelectorAll('#tabs .tab-panel__title')[2].setAttribute('aria-disabled', 'true');
        instance.refresh();

        assert.equal(instance.getSelectedIndex(), 0);
    });

    test('falls back to the first tab when selection was cleared in the DOM before refresh', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        instance.selectTab(2);
        document.querySelectorAll('#tabs [role="tab"]').forEach((b) => b.setAttribute('aria-selected', 'false'));
        assert.equal(instance.getSelectedIndex(), -1);

        instance.refresh();

        assert.equal(instance.getSelectedIndex(), 0);
        assert.equal(document.querySelectorAll('#tabs [role="tabpanel"]')[0].hidden, false);
    });

    test('synchronizes a tab that became enabled after construction', () => {
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title">One</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title" aria-disabled="true">Two</h3><div class="tab-panel__content">2</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title">Three</h3><div class="tab-panel__content">3</div></div>
            </div>
        </div>`;
        const { Tabs, document } = setup(html);
        const instance = new Tabs();

        document.querySelectorAll('#tabs .tab-panel__title')[1].removeAttribute('aria-disabled');
        instance.refresh();

        assert.equal(document.querySelectorAll('#tabs [role="tab"]')[1].disabled, false);
        instance.selectTab(1);
        assert.equal(instance.getSelectedIndex(), 1, 'the newly enabled tab can now be selected');
    });

    test('throws a friendly error if every panel was removed', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        panelsContainer(document).innerHTML = '';

        assert.throws(() => instance.refresh(), /\[@sargadil\/tabs\] No tab panels were found/);
    });

    test('throws a friendly error if the refresh leaves every tab disabled', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        document.querySelectorAll('#tabs .tab-panel__title').forEach((t) => t.setAttribute('aria-disabled', 'true'));

        assert.throws(() => instance.refresh(), /\[@sargadil\/tabs\] At least one enabled tab is required\./);
    });

    test('does not steal focus when focus is outside the tablist', () => {
        const { Tabs, document } = setup(`<input id="outside" type="text">${DEFAULT_HTML}`);
        const instance = new Tabs();
        const outside = document.getElementById('outside');

        outside.focus();
        addPanel(document, 'Four', '4');
        instance.refresh();

        assert.equal(document.activeElement, outside, 'focus must stay where it was');
    });

    test('keeps focus on the active tab when focus was already in the tablist', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();
        const buttons = document.querySelectorAll('#tabs [role="tab"]');

        instance.selectTab(1);
        buttons[1].focus();
        assert.equal(document.activeElement, buttons[1]);

        instance.refresh();

        const refreshed = document.querySelectorAll('#tabs [role="tab"]');
        assert.equal(document.activeElement, refreshed[1], 'focus follows the still-active tab across the rebuild');
    });

    test('keeps multiple instances independent', () => {
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

        instanceB.selectTab(1);

        // grow A, refresh only A
        document.querySelector('#tabs-a .tabs__panels').insertAdjacentHTML(
            'beforeend',
            '<div class="tab-panel"><h3 class="tab-panel__title">A3</h3><div class="tab-panel__content">a3</div></div>',
        );
        instanceA.refresh();

        assert.equal(document.querySelectorAll('#tabs-a [role="tab"]').length, 3);
        assert.equal(document.querySelectorAll('#tabs-b [role="tab"]').length, 2, 'B is untouched');
        assert.equal(instanceB.getSelectedIndex(), 1, 'B keeps its own selection');

        const allIds = [
            ...document.querySelectorAll('#tabs-a [role="tabpanel"], #tabs-a [role="tab"]'),
            ...document.querySelectorAll('#tabs-b [role="tabpanel"], #tabs-b [role="tab"]'),
        ].map((el) => el.id);
        assert.equal(new Set(allIds).size, allIds.length, 'ids stay unique across instances after refresh');

        click(document.querySelectorAll('#tabs-a [role="tab"]')[2], dom);
        assert.equal(instanceA.getSelectedIndex(), 2);
        assert.equal(instanceB.getSelectedIndex(), 1, 'A activity still does not leak into B');
    });

    test('surviving panels keep their id (and the new one gets a fresh unique id)', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        const originalIds = Array.from(document.querySelectorAll('#tabs [role="tabpanel"]')).map((p) => p.id);

        addPanel(document, 'Four', '4');
        instance.refresh();

        const newIds = Array.from(document.querySelectorAll('#tabs [role="tabpanel"]')).map((p) => p.id);

        assert.deepEqual(newIds.slice(0, 3), originalIds, 'existing panels are not renamed');
        assert.equal(new Set(newIds).size, newIds.length, 'all ids unique');
    });

    test('re-syncs ARIA wiring after a middle panel is removed', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        document.querySelectorAll('#tabs .tab-panel')[1].remove();
        instance.refresh();

        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const panels = document.querySelectorAll('#tabs [role="tabpanel"]');

        buttons.forEach((button, i) => {
            assert.equal(button.getAttribute('aria-controls'), panels[i].id);
            assert.equal(panels[i].getAttribute('aria-labelledby'), button.id);
        });

        const selected = Array.from(buttons).filter((b) => b.getAttribute('aria-selected') === 'true');
        assert.equal(selected.length, 1, 'exactly one tab selected');
        const visible = Array.from(panels).filter((p) => !p.hidden);
        assert.equal(visible.length, 1, 'exactly one panel visible');
    });

    test('works with removeTabPanelTitle: labels survive and a new panel is picked up', () => {
        // jsdom has no innerText, so the title text comes from data-nav-title here
        // (same reason as the existing removeTabPanelTitle suite).
        const html = `
        <div class="tabs" id="tabs">
            <div class="tabs__nav"></div>
            <div class="tabs__panels">
                <div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="One">t1</h3><div class="tab-panel__content">1</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="Two">t2</h3><div class="tab-panel__content">2</div></div>
                <div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="Three">t3</h3><div class="tab-panel__content">3</div></div>
            </div>
        </div>`;
        const { Tabs, dom, document } = setup(html);
        const instance = new Tabs({ options: { removeTabPanelTitle: true } });

        assert.deepEqual(tabTexts(document), ['One', 'Two', 'Three']);

        panelsContainer(document).insertAdjacentHTML(
            'beforeend',
            '<div class="tab-panel"><h3 class="tab-panel__title" data-nav-title="Four">t4</h3><div class="tab-panel__content">4</div></div>',
        );
        instance.refresh();

        assert.deepEqual(tabTexts(document), ['One', 'Two', 'Three', 'Four'], 'old labels reused from cache, new one read from its title');
        assert.equal(document.querySelectorAll('#tabs .tab-panel__title').length, 0, 'the new title is removed too');

        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        click(buttons[3], dom);
        assert.equal(instance.getSelectedIndex(), 3);
    });

    test('exactly one tab has tabIndex 0 after refresh', () => {
        const { Tabs, document } = refreshSetup();
        const instance = new Tabs();

        instance.selectTab(2);
        addPanel(document, 'Four', '4');
        instance.refresh();

        const buttons = document.querySelectorAll('#tabs [role="tab"]');
        const zero = Array.from(buttons).filter((b) => b.tabIndex === 0);
        assert.equal(zero.length, 1);
        assert.equal(zero[0], buttons[2]);
    });
});
