import * as config from './internal/config.js';
import * as keyboard from './internal/keyboard.js';
import * as dom from './internal/dom.js';

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
     * Adapter around dom.isSourceDisabled(): whether the tab at panel
     * index `index` is disabled in the as-authored DOM, before the
     * default nav exists. Consulted by config validation, refresh
     * reconciliation, and the `disabled` flags passed to dom.buildNavHtml().
     *
     * @param {number} index
     *   Panel index.
     *
     * @returns {boolean}
     */
    #isSourceDisabled(index) {
        return dom.isSourceDisabled(
            {
                useCustomNav: this.#configs.options.useCustomNav,
                navButtons: this.#objectsHTML['tabsNavButton'],
                panels: this.#objectsHTML['tabPanel'],
                titleSelector: this.#configs.classes.tabPanelTitle,
            },
            index,
        );
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
        const previous_selected_panel = dom.panelForTab(previous_buttons[previous_index], this.#context.ownerDocument);
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
        return dom.selectedIndex(this.#objectsHTML['tabsNavBtn']);
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

        if (dom.isTabDisabled(new_tab)) {
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

        dom.applyRovingTabIndex(tab_buttons, selected_index);

        for (let i = 0; i < tab_buttons.length; i++) {
            tab_buttons[i].removeEventListener('keydown', this.#boundOnKeyDown);
            tab_buttons[i].removeEventListener('click', this.#boundOnClick);
            tab_buttons[i].addEventListener('keydown', this.#boundOnKeyDown);
            tab_buttons[i].addEventListener('click', this.#boundOnClick);
        }

        dom.syncPanels({
            panels: this.#objectsHTML['tabPanel'],
            panelIds: this.#panelIds,
            tabButtons: tab_buttons,
            selectedIndex: selected_index,
            openClass: this.#configs.selectors.tabPanelOpen,
        });

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

        if (dom.isTabDisabled(new_tab)) {
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

        if (dom.isTabDisabled(target)) {
            return;
        }

        const options = this.#configs.options;
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];

        const target_index = keyboard.resolveTargetIndex(event.key, {
            orientation: options.orientation,
            rtl: options.orientation === 'horizontal' && dom.isRtl(target),
            currentIndex: dom.tabIndexByControls(tab_buttons, target),
            enabled: this.#enabledTabs(tab_buttons),
        });

        if (target_index === null) {
            return;
        }

        const new_tab = tab_buttons[target_index];

        if (options.activationMode === 'manual') {
            dom.moveRovingFocus(target, new_tab);
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
        return Array.from(tab_buttons, (button) => !dom.isTabDisabled(button));
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
        const doc = this.#context.ownerDocument;
        const from_index = Array.prototype.indexOf.call(tab_buttons, old_tab);
        const to_index = Array.prototype.indexOf.call(tab_buttons, new_tab);
        const old_panel = dom.panelForTab(old_tab, doc);
        const new_panel = dom.panelForTab(new_tab, doc);

        const allowed = this.#dispatchBeforeChangeEvent(from_index, to_index, old_tab, new_tab, old_panel, new_panel);

        if (!allowed) {
            this.#restoreFocusAfterCancel(tab_buttons, old_tab);
            return;
        }

        dom.markSelected(old_tab, new_tab);
        dom.togglePanels(old_panel, new_panel, this.#configs.selectors.tabPanelOpen);
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
        const active = this.#context.ownerDocument.activeElement;

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
     * Build or adopt the tab navigation, then cache the resulting
     * `role="tab"` elements as `tabsNavBtn`. The markup is produced by
     * internal/dom.js; this method only resolves the button labels and
     * disabled flags that layer needs.
     *
     * @param {number} selected_index
     *   Index of the tab that should be active.
     */
    #insertNav(selected_index) {
        const options = this.#configs.options;

        if (!options.useCustomNav) {
            const panels = this.#objectsHTML['tabPanel'];

            this.#objectsHTML['tabsNavContainer'][0].innerHTML = dom.buildNavHtml({
                panelIds: this.#panelIds,
                navTitles: Array.from(panels, (_panel, i) => this.#getNavTitle(i)),
                disabledFlags: Array.from(panels, (_panel, i) => this.#isSourceDisabled(i)),
                selectedIndex: selected_index,
                listClass: this.#configs.classes.tabsNavList.substring(1),
                buttonClass: this.#configs.classes.tabsNavButton.substring(1),
                ariaLabel: options.ariaLabel,
                vertical: options.orientation === 'vertical',
            });
        } else {
            dom.adoptCustomNav({
                tablist: this.#objectsHTML['tabsNavList'][0],
                navButtons: this.#objectsHTML['tabsNavButton'],
                panelIds: this.#panelIds,
                selectedIndex: selected_index,
                ariaLabel: options.ariaLabel,
                vertical: options.orientation === 'vertical',
            });
        }

        this.#objectsHTML['tabsNavBtn'] = dom.queryTabs(this.#context);
    }

    /**
     * Remove the `.tab-panel__title` elements once their text has been
     * copied into the nav buttons (options.removeTabPanelTitle).
     */
    #removeTabPanelTitle() {
        dom.removeAll(this.#objectsHTML['tabPanelTitle']);
    }

    /**
     * The label for the nav button of panel `index`: options.customNavTitles
     * wins, then the panel's title element (`data-nav-title` or its text),
     * then the label that element produced on an earlier build (kept in
     * #navTitleByPanel so a refresh() after options.removeTabPanelTitle can
     * still regenerate the tab), then "".
     *
     * @param {number} index
     *   Panel index.
     *
     * @returns {string}
     */
    #getNavTitle(index) {
        const panel = this.#objectsHTML['tabPanel'][index];
        let title;

        if (this.#configs.options.customNavTitles.length) {
            title = this.#configs.options.customNavTitles[index];
        } else {
            const title_element = panel.querySelector(this.#configs.classes.tabPanelTitle);

            title = title_element ? dom.titleText(title_element) : this.#navTitleByPanel.get(panel);
        }

        if (title === undefined) {
            title = '';
        }

        this.#navTitleByPanel.set(panel, title);

        return title;
    }

    /**
     * Assign every panel a stable, collision-free id (see
     * internal/dom.js → ensurePanelIds).
     */
    #generatePanelIds() {
        this.#panelIds = dom.ensurePanelIds(
            this.#objectsHTML['tabPanel'],
            this.#configs.selectors.tabPanelIdPrefix,
            this.#context.ownerDocument,
        );
    }

    /**
     * Resolve the context element and query it for every configured
     * selector. The context lookup stays here — it is the entry point,
     * before #context (and its document) is known.
     */
    #initElements() {
        const context_id = this.#configs.contextID;
        const context = context_id instanceof HTMLElement ? context_id : document.getElementById(context_id);

        if (!context) {
            this.#throwError(`Context element was not found. Expected an element with id "${context_id}".`);
        }

        this.#context = context;

        Object.assign(this.#objectsHTML, dom.discoverElements(context, this.#configs.classes));
    }
}

export default Tabs;
