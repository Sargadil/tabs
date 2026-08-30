import * as config from './internal/config.js';
import * as keyboard from './internal/keyboard.js';

class Tabs {

    #objectsHTML = {};

    // The effective configuration (defaults + the caller's object).
    // Assigned in the constructor via mergeConfig().
    #configs;

    #swipeThreshold = 50;

    #boundOnKeyDown = this.#onKeyDown.bind(this);
    #boundOnClick = this.#onClick.bind(this);
    #boundOnTouchStart = this.#onTouchStart.bind(this);
    #boundOnTouchEnd = this.#onTouchEnd.bind(this);
    #context = null;
    #panelIds = [];
    #touchStartX = 0;
    #touchStartY = 0;

    /**
     * Nav-button label derived for each panel at build time, keyed by the
     * panel element. Only consulted as a fallback in #getNavTitle(): with
     * options.removeTabPanelTitle the source `.tab-panel__title` element is
     * gone after the first build, so a later refresh() still needs the
     * label it produced back then to regenerate that tab.
     */
    #navTitleByPanel = new WeakMap();

    constructor(configs) {
        this.#configs = config.mergeConfig(configs);
        config.validateConfig(this.#configs);
        this.#initElements();
        this.#validateDomStructure();
        this.#generatePanelIds();
        this.#initTabs(this.#configs.options.initSelectedItem);

        if (this.#configs.options.removeTabPanelTitle) {
            this.#removeTabPanelTitle();
        }
    }

    /**
     * Throw a public configuration/DOM error, consistently prefixed so
     * callers get a readable, actionable message instead of a raw
     * low-level exception (e.g. "Cannot read properties of undefined").
     *
     * @param {string} message
     *   Error message, without the package prefix.
     */
    #throwError(message) {
        throw new Error(`[@sargadil/tabs] ${message}`);
    }

    /**
     * Validate the DOM structures required for a working instance, once
     * #initElements() has queried the context element and its child
     * collections. The rules and messages live in internal/config.js;
     * this method only adapts instance state to that pure validator —
     * element counts, and a disabled-state probe bound to this instance.
     *
     * @param {boolean} is_refresh
     *   True when called from refresh() (relaxes the construction-only
     *   initSelectedItem / missing-title rules).
     */
    #validateDomStructure(is_refresh = false) {
        const elements = this.#objectsHTML;

        config.validateDomStructure(
            this.#configs,
            {
                panelCount: elements['tabPanel'].length,
                navButtonCount: elements['tabsNavButton'].length,
                navContainerCount: elements['tabsNavContainer'].length,
                titleCount: elements['tabPanelTitle'].length,
            },
            (index) => this.#isSourceDisabled(index),
            is_refresh,
        );
    }

    /**
     * Whether the tab at panel index `index` is disabled, read from the
     * as-authored DOM before nav generation. Custom nav reads the
     * author's own tab element directly (it already exists); the
     * default nav reads `aria-disabled="true"` from the panel's title
     * element, since no tab element exists yet to carry it — the
     * generated `<button>` gets a native `disabled` attribute from this
     * flag once it's created (see #createNav()).
     *
     * @param {number} index
     *   Panel index.
     *
     * @returns {boolean}
     */
    #isSourceDisabled(index) {
        if (this.#configs.options.useCustomNav) {
            return this.#isTabDisabled(this.#objectsHTML['tabsNavButton'][index]);
        }

        const title = this.#objectsHTML['tabPanel'][index].querySelector(this.#configs.classes.tabPanelTitle);

        return title ? title.getAttribute('aria-disabled') === 'true' : false;
    }

    /**
     * Whether a tab element is disabled: native `disabled` (buttons,
     * preferred) or `aria-disabled="true"` (custom non-button tabs).
     *
     * @param {HTMLElement} tab
     *   Tab element.
     *
     * @returns {boolean}
     */
    #isTabDisabled(tab) {
        return tab.disabled === true || tab.getAttribute('aria-disabled') === 'true';
    }

    /**
     * Remove all event listeners added by this instance.
     *
     * Call this before discarding a Tabs instance (e.g. on component
     * unmount in a framework) to avoid leaking listeners.
     */
    destroy() {
        this.#teardownListeners(this.#objectsHTML['tabsNavBtn'], this.#objectsHTML['tabPanel']);
    }

    /**
     * Remove the keydown/click listeners from `tab_buttons` and the
     * touch listeners from `panels`. removeEventListener() is a no-op for
     * a listener that was never attached, so this is safe to call on
     * elements that may or may not currently be wired up (e.g. panels
     * when options.swipeable is off).
     *
     * @param {NodeList|HTMLElement[]} tab_buttons
     *   Tab buttons to unbind.
     *
     * @param {NodeList|HTMLElement[]} panels
     *   Tab panels to unbind.
     */
    #teardownListeners(tab_buttons, panels) {
        for (let i = 0; i < tab_buttons.length; i++) {
            tab_buttons[i].removeEventListener('keydown', this.#boundOnKeyDown);
            tab_buttons[i].removeEventListener('click', this.#boundOnClick);
        }

        panels.forEach((panel) => {
            panel.removeEventListener('touchstart', this.#boundOnTouchStart);
            panel.removeEventListener('touchend', this.#boundOnTouchEnd);
        });
    }

    /**
     * Re-synchronize this instance with the current DOM.
     *
     * Call this after the consumer has changed the tabs/panels markup —
     * added or removed panels (AJAX, a CMS, HTMX, a framework re-render),
     * or toggled a tab's disabled state. The DOM stays the consumer's
     * responsibility; there is deliberately no addTab()/removeTab().
     *
     * refresh() re-reads panels and navigation from the live DOM,
     * re-validates the structure, moves listeners off removed elements and
     * onto new ones (never binding an element twice), re-synchronizes the
     * ARIA relationships, panel ids, and disabled state, and keeps the
     * currently active tab selected if its panel still exists. If the
     * active panel was removed, the tab that took its position becomes
     * active (or the new last tab, if the removed one was last), skipping
     * disabled tabs. Focus is only moved if it was already inside this
     * tablist. No `tabs:beforechange`/`tabs:change` event is dispatched.
     */
    refresh() {
        const previous_buttons = this.#objectsHTML['tabsNavBtn'];
        const previous_panels = this.#objectsHTML['tabPanel'];
        const previous_index = this.getSelectedIndex();
        const previous_selected_panel = this.#panelForTab(previous_buttons[previous_index]);
        const focus_was_in_tablist =
            Array.prototype.indexOf.call(previous_buttons, this.#context.ownerDocument.activeElement) !== -1;

        // Re-read the live DOM and re-validate before mutating anything, so
        // a now-invalid DOM (e.g. every panel removed) throws while the
        // instance is still fully wired to its previous elements.
        this.#initElements();
        this.#validateDomStructure(true);

        // Safe to mutate now. Detach listeners from the previous elements
        // first, so re-attaching below can never leave one bound twice.
        this.#teardownListeners(previous_buttons, previous_panels);

        this.#generatePanelIds();
        this.#initTabs(this.#resolveActiveIndex(previous_selected_panel, previous_index));

        if (this.#configs.options.removeTabPanelTitle) {
            this.#removeTabPanelTitle();
        }

        if (focus_was_in_tablist) {
            this.#objectsHTML['tabsNavBtn'][this.getSelectedIndex()].focus();
        }
    }

    /**
     * The panel a tab controls, or null when there is no such tab (e.g.
     * nothing was selected before a refresh()).
     *
     * @param {HTMLElement} [tab]
     *   Tab button.
     *
     * @returns {HTMLElement|null}
     */
    #panelForTab(tab) {
        return tab ? document.getElementById(tab.getAttribute('aria-controls')) : null;
    }

    /**
     * Decide which tab index should be active after a refresh().
     *
     * Keeps the previous selection if its panel is still in the DOM. If
     * that panel was removed, falls back to whatever panel now sits at the
     * old position (visually "the next tab"), clamped to the new last
     * panel if the removed one was last ("the previous tab"). If the
     * resulting tab is disabled — including when the still-present active
     * tab was just disabled — advances (wrapping) to the next enabled one.
     * #validateDomStructure() has already guaranteed at least one enabled tab.
     *
     * @param {HTMLElement|null} previous_selected_panel
     *   The panel that was active before the refresh, if any.
     *
     * @param {number} previous_index
     *   The index that was active before the refresh (-1 if none).
     *
     * @returns {number}
     */
    #resolveActiveIndex(previous_selected_panel, previous_index) {
        const panels = this.#objectsHTML['tabPanel'];
        let index = Array.prototype.indexOf.call(panels, previous_selected_panel);

        if (index === -1) {
            index = Math.min(Math.max(previous_index, 0), panels.length - 1);
        }

        while (this.#isSourceDisabled(index)) {
            index = (index + 1) % panels.length;
        }

        return index;
    }

    /**
     * Get the index of the currently selected tab.
     *
     * @returns {number}
     *   Return the index of the currently selected tab, or -1 if none is selected.
     */
    getSelectedIndex() {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];

        return Array.from(tab_buttons).findIndex((item) => item.getAttribute('aria-selected') === 'true');
    }

    /**
     * Select a tab by index.
     *
     * @param {number} index
     *   Index of the tab to select.
     */
    selectTab(index) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const new_tab = tab_buttons[index];

        if (!new_tab) {
            this.#throwError(`selectTab: no tab exists at index ${index}.`);
        }

        if (this.#isTabDisabled(new_tab)) {
            this.#throwError(`Cannot select disabled tab at index ${index}.`);
        }

        const old_tab = tab_buttons[this.getSelectedIndex()];

        this.#setSelectedTab(old_tab, new_tab);
    }

    /**
     * Build (or rebuild) the navigation, wire up listeners, and sync every
     * panel to the given active tab. Shared by the constructor and
     * refresh(); the listener wiring removes before it adds, so a rebuild
     * over elements that persist (custom nav buttons, existing panels)
     * never leaves them bound twice.
     *
     * @param {number} selected_index
     *   Index of the tab that should be active.
     */
    #initTabs(selected_index) {
        this.#insertNav(selected_index);

        const tab_buttons = this.#objectsHTML['tabsNavBtn'];

        for (let i = 0; i < tab_buttons.length; i++) {
            tab_buttons[i].tabIndex = selected_index === i ? 0 : -1;
            tab_buttons[i].removeEventListener('keydown', this.#boundOnKeyDown);
            tab_buttons[i].removeEventListener('click', this.#boundOnClick);
            tab_buttons[i].addEventListener('keydown', this.#boundOnKeyDown);
            tab_buttons[i].addEventListener('click', this.#boundOnClick);
        }

        this.#prepareTabContent(selected_index);

        if (this.#configs.options.swipeable) {
            this.#initSwipe();
        }
    }

    /**
     * Attach touch listeners to each panel to switch tabs on a
     * horizontal swipe (options.swipeable). Removes before adding so a
     * refresh() over surviving panels doesn't bind them twice.
     */
    #initSwipe() {
        this.#objectsHTML['tabPanel'].forEach((panel) => {
            panel.style.touchAction = 'pan-y';
            panel.removeEventListener('touchstart', this.#boundOnTouchStart);
            panel.removeEventListener('touchend', this.#boundOnTouchEnd);
            panel.addEventListener('touchstart', this.#boundOnTouchStart, { passive: true });
            panel.addEventListener('touchend', this.#boundOnTouchEnd, { passive: true });
        });
    }

    /**
     * Record the starting point of a touch (options.swipeable).
     *
     * @param {TouchEvent} event
     *   Touchstart event.
     */
    #onTouchStart(event) {
        this.#touchStartX = event.changedTouches[0].screenX;
        this.#touchStartY = event.changedTouches[0].screenY;
    }

    /**
     * Switch to the previous/next tab if the touch ended far enough
     * away horizontally to count as a swipe rather than a vertical
     * scroll (options.swipeable). Skips disabled tabs and wraps around
     * via the same keyboard.adjacentEnabledIndex() that ArrowLeft/
     * ArrowRight use, rather than the public selectTab(), which would
     * throw if the plain adjacent index were disabled.
     *
     * @param {TouchEvent} event
     *   Touchend event.
     */
    #onTouchEnd(event) {
        const touch = event.changedTouches[0];
        const delta_x = touch.screenX - this.#touchStartX;
        const delta_y = touch.screenY - this.#touchStartY;

        if (Math.abs(delta_x) < this.#swipeThreshold || Math.abs(delta_x) <= Math.abs(delta_y)) {
            return;
        }

        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const current_index = this.getSelectedIndex();
        const current_tab = tab_buttons[current_index];
        const target_index = keyboard.adjacentEnabledIndex(
            current_index,
            delta_x < 0 ? 1 : -1,
            this.#enabledTabs(tab_buttons),
        );

        this.#setSelectedTab(current_tab, tab_buttons[target_index]);
    }

    /**
     * Do appropriate action based on click event.
     *
     * @param {PointerEvent} event
     *   Click event.
     */
    #onClick(event) {
        const new_tab = event.currentTarget;

        if (this.#isTabDisabled(new_tab)) {
            return;
        }

        const old_tab = this.#context.querySelector('[aria-selected = "true"]');

        this.#setSelectedTab(old_tab, new_tab);
    }

    /**
     * Do appropriate action based on key event.
     *
     * The "which tab" decision (orientation, RTL, wrapping, skipping
     * disabled tabs) lives in internal/keyboard.js. This method only
     * gathers the current state, then applies the returned index as a
     * selection (automatic activation) or a focus move (manual).
     *
     * @param {KeyboardEvent} event
     *   Keydown event.
     */
    #onKeyDown(event) {
        const target = event.currentTarget;

        if (this.#isTabDisabled(target)) {
            return;
        }

        const options = this.#configs.options;
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];

        const target_index = keyboard.resolveTargetIndex(event.key, {
            orientation: options.orientation,
            rtl: options.orientation === 'horizontal' && this.#isRTL(target),
            currentIndex: this.#getClickedTabIndex(tab_buttons, target),
            enabled: this.#enabledTabs(tab_buttons),
        });

        if (target_index === null) {
            return;
        }

        const new_tab = tab_buttons[target_index];

        if (options.activationMode === 'manual') {
            this.#moveFocusTo(target, new_tab);
        } else {
            this.#setSelectedTab(target, new_tab);
        }

        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * The enabled/disabled flag for each nav button, in document order —
     * the shape internal/keyboard.js consumes.
     *
     * @param {NodeList} tab_buttons
     *   Nav buttons.
     *
     * @returns {boolean[]}
     */
    #enabledTabs(tab_buttons) {
        return Array.from(tab_buttons, (button) => !this.#isTabDisabled(button));
    }

    /**
     * Whether `element`'s reading direction is right-to-left, per the
     * cascaded CSS `direction` property. `direction` is exactly what the
     * UA stylesheet derives from `dir="rtl"` on `<html>` or any closer
     * ancestor (e.g. a wrapper around just this tablist), so reading it
     * here — instead of adding an `options.rtl` flag — keeps the page's
     * own markup as the single source of truth for direction.
     *
     * Only meaningful for horizontal orientation: vertical arrow keys
     * (Up/Down) don't have a left/right reading direction to flip.
     *
     * @param {HTMLElement} element
     *   Element to read the computed direction of (typically the
     *   focused tab).
     *
     * @returns {boolean}
     */
    #isRTL(element) {
        return element.ownerDocument.defaultView.getComputedStyle(element).direction === 'rtl';
    }

    /**
     * Move the roving tabindex and keyboard focus to a tab, without
     * touching aria-selected or the visible panel.
     *
     * @param {HTMLElement} old_tab
     *   Previously focused tab.
     *
     * @param {HTMLElement} new_tab
     *   Tab to move focus to.
     */
    #moveFocusTo(old_tab, new_tab) {
        old_tab.tabIndex = -1;
        new_tab.tabIndex = 0;
        new_tab.focus();
    }

    /**
     * Toggle tab panel.
     *
     * Dispatches the cancelable "tabs:beforechange" event first; if a
     * listener calls preventDefault(), the transition is aborted before
     * any ARIA/tabindex/hidden/focus state is touched, and "tabs:change"
     * never fires.
     *
     * @param {HTMLElement} old_tab
     *   Old tab element.
     *
     * @param {HTMLElement} new_tab
     *   New tab element.
     */
    #setSelectedTab(old_tab, new_tab) {
        if (old_tab === new_tab) {
            return;
        }

        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const from_index = Array.prototype.indexOf.call(tab_buttons, old_tab);
        const to_index = Array.prototype.indexOf.call(tab_buttons, new_tab);
        const old_panel = document.getElementById(old_tab.getAttribute('aria-controls'));
        const new_panel = document.getElementById(new_tab.getAttribute('aria-controls'));

        const allowed = this.#dispatchBeforeChangeEvent(from_index, to_index, old_tab, new_tab, old_panel, new_panel);

        if (!allowed) {
            this.#restoreFocusAfterCancel(tab_buttons, old_tab);
            return;
        }

        old_tab.setAttribute('aria-selected', 'false');
        old_tab.tabIndex = -1;
        new_tab.setAttribute('aria-selected', 'true');
        new_tab.tabIndex = 0;
        new_tab.focus();

        this.#toggleTabContent(old_panel, new_panel);
        this.#dispatchChangeEvent(to_index, new_tab, new_panel);
    }

    /**
     * Dispatch the cancelable, bubbling "tabs:beforechange" CustomEvent on
     * the context element, giving listeners a chance to veto the pending
     * transition before any state is mutated.
     *
     * @param {number} from_index
     *   Index of the currently selected tab.
     *
     * @param {number} to_index
     *   Index of the tab about to be selected.
     *
     * @param {HTMLElement} old_tab
     *   Currently selected tab button.
     *
     * @param {HTMLElement} new_tab
     *   Tab button about to be selected.
     *
     * @param {HTMLElement} old_panel
     *   Currently visible panel.
     *
     * @param {HTMLElement} new_panel
     *   Panel about to become visible.
     *
     * @returns {boolean}
     *   Return false if a listener called preventDefault(), true otherwise.
     */
    #dispatchBeforeChangeEvent(from_index, to_index, old_tab, new_tab, old_panel, new_panel) {
        return this.#context.dispatchEvent(new CustomEvent('tabs:beforechange', {
            bubbles: true,
            cancelable: true,
            detail: {
                fromIndex: from_index,
                toIndex: to_index,
                fromTab: old_tab,
                toTab: new_tab,
                fromPanel: old_panel,
                toPanel: new_panel,
            },
        }));
    }

    /**
     * After a "tabs:beforechange" listener cancels a transition, restore
     * focus to the still-selected tab if browser default behavior (e.g.
     * a mousedown focusing the clicked button before the click handler
     * runs) already moved DOM focus to a different tab in this tablist.
     * Left untouched when focus lies outside the tablist entirely, so a
     * canceled programmatic selectTab() call never steals focus from
     * unrelated page content.
     *
     * @param {NodeList} tab_buttons
     *   Nav buttons.
     *
     * @param {HTMLElement} old_tab
     *   Still-selected tab to restore focus to.
     */
    #restoreFocusAfterCancel(tab_buttons, old_tab) {
        const active = document.activeElement;

        if (active !== old_tab && Array.prototype.indexOf.call(tab_buttons, active) !== -1) {
            old_tab.focus();
        }
    }

    /**
     * Dispatch a "tabs:change" CustomEvent on the context element.
     *
     * @param {number} index
     *   Index of the newly selected tab.
     *
     * @param {HTMLElement} tab
     *   Newly selected tab button.
     *
     * @param {HTMLElement} panel
     *   Newly selected tab panel.
     */
    #dispatchChangeEvent(index, tab, panel) {
        this.#context.dispatchEvent(new CustomEvent('tabs:change', {
            bubbles: true,
            detail: { index, tab, panel },
        }));
    }

    /**
     * Prepared tab content by adding appropriate attributes.
     *
     * `hidden` is the semantic source of truth for panel visibility: it
     * hides inactive panels natively, without depending on bundled CSS.
     * The `tab-panel--open` class is kept in sync purely as a styling hook.
     */
    #prepareTabContent(selected_index) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const open_class_selector = this.#configs.selectors.tabPanelOpen;

        this.#objectsHTML['tabPanel'].forEach((item, index) => {
            const is_selected = selected_index === index;

            item.setAttribute('id', this.#panelIds[index]);
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'tabpanel');
            item.hidden = !is_selected;
            item.classList.toggle(open_class_selector, is_selected);

            if (tab_buttons[index]) {
                item.setAttribute('aria-labelledby', tab_buttons[index].id);
            }
        });
    }

    /**
     * Toggle tab panel visibility.
     *
     * Sets `hidden` on the outgoing/incoming panel as the source of truth
     * for their visibility, and keeps the `tab-panel--open` class in sync
     * as a styling hook. `hidden` is never delayed for animation purposes.
     *
     * @param {HTMLElement} old_panel
     *   Outgoing panel element.
     *
     * @param {HTMLElement} new_panel
     *   Incoming panel element.
     */
    #toggleTabContent(old_panel, new_panel) {
        const open_selector = this.#configs.selectors.tabPanelOpen;

        old_panel.classList.remove(open_selector);
        old_panel.hidden = true;

        new_panel.classList.add(open_selector);
        new_panel.hidden = false;
    }

    /**
     * Get clicked nav button index.
     *
     * @param {NodeList} tab_buttons
     *   Nav buttons.
     *
     * @param {HTMLElement} target
     *   Clicked nav button.
     *
     * @returns {number}
     *   Return current clicked nav button index.
     */
    #getClickedTabIndex(tab_buttons, target) {
        return Array.from(tab_buttons).findIndex((item) => {
            return item.getAttribute('aria-controls') === target.getAttribute('aria-controls');
        });
    }

    /**
     * Prepare and insert tab navigation.
     */
    #insertNav(selected_index) {
        if (!this.#configs.options.useCustomNav) {
            this.#objectsHTML['tabsNavContainer'][0].innerHTML = this.#createNav(selected_index);
        } else {
            this.#preparedCustomNavButton(selected_index);
        }

        this.#appendElement('tabsNavBtn', this.#context.querySelectorAll('[role = "tab"]'));
    }

    /**
     * Remove title from tab panel.
     */
    #removeTabPanelTitle() {
        this.#objectsHTML['tabPanelTitle'].forEach((item) => {
            item.remove();
        });
    }

    /**
     * Get nav title.
     *
     * @param {number} index
     *   Nav title index.
     *
     * @returns {string}
     *   Return title string.
     */
    #getNavTitle(index) {
        const panel = this.#objectsHTML['tabPanel'][index];
        let title;

        if (this.#configs.options.customNavTitles.length) {
            title = this.#configs.options.customNavTitles[index];
        } else {
            const title_element = panel.querySelector(this.#configs.classes.tabPanelTitle);

            // options.removeTabPanelTitle deletes the source element after the
            // first build, so a later refresh() falls back to the label that
            // element produced back then, kept per-panel in #navTitleByPanel.
            title = title_element
                ? (title_element.getAttribute('data-nav-title') ?? title_element.innerText)
                : this.#navTitleByPanel.get(panel);
        }

        if (title === undefined) {
            title = '';
        }

        this.#navTitleByPanel.set(panel, title);

        return title;
    }

    /**
     * Create default raw nav HTML.
     *
     * @returns {string}
     *   Return raw nav HTML.
     */
    #createNav(selected_index) {
        const tab_nav_list_selector = this.#configs.classes.tabsNavList.substring(1);
        const tab_nav_btn_selector = this.#configs.classes.tabsNavButton.substring(1);
        const aria_label = this.#configs.options.ariaLabel;
        const aria_label_attr = aria_label ? ` aria-label="${aria_label}"` : '';
        const is_vertical = this.#configs.options.orientation === 'vertical';
        const aria_orientation_attr = is_vertical ? ` aria-orientation="vertical"` : '';

        let html = `<div class="${tab_nav_list_selector}" role="tablist"${aria_label_attr}${aria_orientation_attr}>`;

        for (let i = 0; i < this.#objectsHTML['tabPanel'].length; i++) {
            let tab_panel_id = this.#panelIds[i];
            let tab_id = tab_panel_id + '-tab';
            let is_selected = selected_index === i;
            let disabled_attr = this.#isSourceDisabled(i) ? ' disabled' : '';

            html += `<button type="button" id="${tab_id}" class="${tab_nav_btn_selector}" role="tab" aria-selected="${is_selected ? 'true' : 'false'}" aria-controls="${tab_panel_id}"${disabled_attr}>${this.#getNavTitle(i)}</button>`
        }

        html += '</div>';
        return html;
    }

    /**
     * Prepared custom nav buttons by adding aria attributes.
     *
     * If a nav element is a `<button>` without an explicit `type`, it is
     * given `type="button"` so it can't accidentally submit an enclosing
     * `<form>`. Elements other than `<button>` are left untouched.
     */
    #preparedCustomNavButton(selected_index) {
        if (this.#objectsHTML['tabsNavList'].length > 0) {
            const tablist = this.#objectsHTML['tabsNavList'][0];

            tablist.setAttribute('role', 'tablist');

            if (this.#configs.options.ariaLabel) {
                tablist.setAttribute('aria-label', this.#configs.options.ariaLabel);
            }

            if (this.#configs.options.orientation === 'vertical') {
                tablist.setAttribute('aria-orientation', 'vertical');
            }
        }

        for (let i = 0; i < this.#objectsHTML['tabsNavButton'].length; i++) {
            const button = this.#objectsHTML['tabsNavButton'][i];
            let tab_panel_id = this.#panelIds[i];
            let is_selected = selected_index === i;

            if (!button.id) {
                button.setAttribute('id', tab_panel_id + '-tab');
            }

            if (button.tagName === 'BUTTON' && !button.hasAttribute('type')) {
                button.setAttribute('type', 'button');
            }

            button.setAttribute('aria-controls', tab_panel_id);
            button.setAttribute('aria-selected', is_selected ? 'true' : 'false');
        }
    }

    /**
     * Pre-compute a unique DOM id for each tab panel, so multiple Tabs
     * instances with the default tabPanelIdPrefix on the same page
     * don't collide (which would produce invalid duplicate-id HTML and
     * make document.getElementById resolve to the wrong instance).
     */
    #generatePanelIds() {
        const prefix = this.#configs.selectors.tabPanelIdPrefix;
        const ids = [];

        this.#objectsHTML['tabPanel'].forEach((panel, index) => {
            // Keep an id a panel already has — its own from a previous build,
            // or one the consumer set — so refresh() doesn't rename surviving
            // panels (and break bookmarked in-page links to them). Only newly
            // added panels get a fresh id, made unique against the whole
            // document so it can't clash with another instance or a kept id.
            if (!panel.id) {
                panel.id = this.#makeUniqueId(`${prefix}-${index}`);
            }

            ids.push(panel.id);
        });

        this.#panelIds = ids;
    }

    /**
     * Return base_id, or base_id with an incrementing numeric suffix
     * if an element with that id already exists elsewhere in the
     * document (e.g. from another Tabs instance on the same page).
     *
     * @param {string} base_id
     *
     * @returns {string}
     */
    #makeUniqueId(base_id) {
        let id = base_id;
        let suffix = 2;

        while (document.getElementById(id)) {
            id = `${base_id}-${suffix}`;
            suffix++;
        }

        return id;
    }

    /**
     * Init HTML element based on configs css class selectors.
     */
    #initElements() {
        const classes = this.#configs.classes;
        const context_id = this.#configs.contextID;
        const context = context_id instanceof HTMLElement ? context_id : document.getElementById(context_id);

        if (!context) {
            this.#throwError(`Context element was not found. Expected an element with id "${context_id}".`);
        }

        this.#context = context;

        for (const el in classes) {
            this.#objectsHTML[el] = context.querySelectorAll(classes[el]);
        }
    }

    /**
     * Append NodeList elements to array.
     *
     * @param {string} name
     *   Element name.
     *
     * @param {NodeList} value
     *   HTML node list.
     */
    #appendElement(name, value) {
        this.#objectsHTML[name] = value;
    }
}

export default Tabs;
