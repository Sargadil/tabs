class Tabs {

    #objectsHTML = {};

    #configs = {
        contextID: 'tabs',
        classes: {
            tabsNavContainer: '.tabs__nav',
            tabsNavList: '.tabs__nav-list',
            tabsNavButton: '.tabs__nav-btn',
            tabPanel: '.tab-panel',
            tabPanelTitle: '.tab-panel__title',
        },
        selectors: {
            tabPanelIdPrefix: 'tabpanel',
            tabPanelOpen: 'tab-panel--open',
        },
        options: {
            useCustomNav: false,
            customNavTitles: [],
            initSelectedItem: 0,
            removeTabPanelTitle: false,
            ariaLabel: '',
            orientation: 'horizontal',
            activationMode: 'automatic',
            swipeable: false,
        }
    }

    #swipeThreshold = 50;

    #boundOnKeyDown = this.#onKeyDown.bind(this);
    #boundOnClick = this.#onClick.bind(this);
    #boundOnTouchStart = this.#onTouchStart.bind(this);
    #boundOnTouchEnd = this.#onTouchEnd.bind(this);
    #context = null;
    #panelIds = [];
    #touchStartX = 0;
    #touchStartY = 0;

    constructor(configs) {
        this.#configs = this.#deepMerge(this.#configs, configs);
        this.#validateConfig();
        this.#initElements();
        this.#validateDOM();
        this.#generatePanelIds();
        this.#initTabs();

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
     * Validate configuration values that don't require DOM access yet
     * (contextID's type, orientation, activationMode, initSelectedItem's
     * shape). Centralizing these checks here means every constructor
     * run fails fast, on the same rules, with the same error format.
     */
    #validateConfig() {
        const context_id = this.#configs.contextID;
        const options = this.#configs.options;

        if (typeof context_id !== 'string' && !(context_id instanceof HTMLElement)) {
            this.#throwError(`"contextID" must be a string or an HTMLElement. Received ${typeof context_id}.`);
        }

        if (options.orientation !== 'horizontal' && options.orientation !== 'vertical') {
            this.#throwError(`"orientation" must be "horizontal" or "vertical". Received ${JSON.stringify(options.orientation)}.`);
        }

        if (options.activationMode !== 'automatic' && options.activationMode !== 'manual') {
            this.#throwError(`"activationMode" must be "automatic" or "manual". Received ${JSON.stringify(options.activationMode)}.`);
        }

        if (!Number.isInteger(options.initSelectedItem) || options.initSelectedItem < 0) {
            this.#throwError(`"initSelectedItem" must be an integer >= 0. Received ${JSON.stringify(options.initSelectedItem)}.`);
        }
    }

    /**
     * Validate the DOM structures required for a working instance, once
     * the context element and its child collections have been queried
     * by #initElements(). Centralizing these checks here avoids
     * scattering identical presence checks across #insertNav(),
     * #prepareTabContent(), etc.
     */
    #validateDOM() {
        const classes = this.#configs.classes;
        const options = this.#configs.options;
        const panel_count = this.#objectsHTML['tabPanel'].length;

        if (panel_count === 0) {
            this.#throwError(`No tab panels were found. Expected at least one element matching "${classes.tabPanel}".`);
        }

        if (options.initSelectedItem >= panel_count) {
            this.#throwError(`initSelectedItem ${options.initSelectedItem} is out of range. Found ${panel_count} tabs.`);
        }

        if (options.useCustomNav) {
            const tab_count = this.#objectsHTML['tabsNavButton'].length;

            if (tab_count === 0) {
                this.#throwError(`No custom navigation elements were found. Expected at least one element matching "${classes.tabsNavButton}" (options.useCustomNav is true).`);
            }

            if (tab_count !== panel_count) {
                this.#throwError(`Custom navigation has ${tab_count} tab(s) but there are ${panel_count} panel(s). The counts must match.`);
            }
        } else {
            if (this.#objectsHTML['tabsNavContainer'].length === 0) {
                this.#throwError(`Tab navigation container was not found. Expected an element matching "${classes.tabsNavContainer}".`);
            }

            const title_count = this.#objectsHTML['tabPanelTitle'].length;

            if (title_count !== panel_count) {
                this.#throwError(`Expected ${panel_count} tab panel title(s) matching "${classes.tabPanelTitle}" (one per panel) but found ${title_count}. Each panel needs a title element; options.customNavTitles only overrides its displayed text.`);
            }
        }
    }

    /**
     * Remove all event listeners added by this instance.
     *
     * Call this before discarding a Tabs instance (e.g. on component
     * unmount in a framework) to avoid leaking listeners.
     */
    destroy() {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];

        for (let i = 0; i < tab_buttons.length; i++) {
            tab_buttons[i].removeEventListener('keydown', this.#boundOnKeyDown);
            tab_buttons[i].removeEventListener('click', this.#boundOnClick);
        }

        if (this.#configs.options.swipeable) {
            this.#objectsHTML['tabPanel'].forEach((panel) => {
                panel.removeEventListener('touchstart', this.#boundOnTouchStart);
                panel.removeEventListener('touchend', this.#boundOnTouchEnd);
            });
        }
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

        const old_tab = tab_buttons[this.getSelectedIndex()];

        this.#setSelectedTab(old_tab, new_tab);
    }

    /**
     * Initial tabs functionality.
     */
    #initTabs() {
        this.#insertNav();

        const tab_buttons = this.#objectsHTML['tabsNavBtn'];

        for (let i = 0; i < tab_buttons.length; i++) {
            const tab_panel = document.getElementById(tab_buttons[i].getAttribute('aria-controls'));

            tab_buttons[i].tabIndex = this.#configs.options.initSelectedItem === i ? 0 : -1;
            tab_buttons[i].addEventListener('keydown', this.#boundOnKeyDown);
            tab_buttons[i].addEventListener('click', this.#boundOnClick);
        }

        this.#prepareTabContent();

        if (this.#configs.options.swipeable) {
            this.#initSwipe();
        }
    }

    /**
     * Attach touch listeners to each panel to switch tabs on a
     * horizontal swipe (options.swipeable).
     */
    #initSwipe() {
        this.#objectsHTML['tabPanel'].forEach((panel) => {
            panel.style.touchAction = 'pan-y';
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
     * scroll (options.swipeable).
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
        const next_index = delta_x < 0
            ? (current_index < tab_buttons.length - 1 ? current_index + 1 : 0)
            : (current_index > 0 ? current_index - 1 : tab_buttons.length - 1);

        this.selectTab(next_index);
    }

    /**
     * Do appropriate action based on click event.
     *
     * @param {PointerEvent} event
     *   Click event.
     */
    #onClick(event) {
        const new_tab = event.currentTarget;
        const old_tab = this.#context.querySelector('[aria-selected = "true"]');

        this.#setSelectedTab(old_tab, new_tab);
    }

    /**
     * Do appropriate action based on key event.
     *
     * @param {KeyboardEvent} event
     *   Keydown event.
     */
    #onKeyDown(event) {
        const target = event.currentTarget;
        const is_vertical = this.#configs.options.orientation === 'vertical';
        const is_manual = this.#configs.options.activationMode === 'manual';
        const previous_key = is_vertical ? 'ArrowUp' : 'ArrowLeft';
        const next_key = is_vertical ? 'ArrowDown' : 'ArrowRight';
        let flag = false;

        switch (event.key) {
            case previous_key:
                is_manual ? this.#moveFocusToPreviousTab(target) : this.#setSelectedToPreviousTab(target);
                flag = true;
                break;
            case next_key:
                is_manual ? this.#moveFocusToNextTab(target) : this.#setSelectedToNextTab(target);
                flag = true;
                break;
            case 'Home':
                is_manual ? this.#moveFocusToFirstTab(target) : this.#setSelectedToFirstTab(target);
                flag = true;
                break;
            case 'End':
                is_manual ? this.#moveFocusToLastTab(target) : this.#setSelectedToLastTab(target);
                flag = true;
                break;
        }

        if (flag) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    /**
     * Select previous tab.
     *
     * @param {HTMLElement} target
     *   Clicked nav button.
     */
    #setSelectedToPreviousTab(target) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const current_tab_index = this.#getClickedTabIndex(tab_buttons, target);
        const new_current_tab = this.#getPreviousTab(current_tab_index, tab_buttons);

        this.#setSelectedTab(target, new_current_tab);
    }


    /**
     * Select next tab.
     *
     * @param {HTMLElement} target
     *   Clicked nav button.
     */
    #setSelectedToNextTab(target) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const current_tab_index = this.#getClickedTabIndex(tab_buttons, target);
        const new_current_tab = this.#getNextTab(current_tab_index, tab_buttons);

        this.#setSelectedTab(target, new_current_tab);
    }

    /**
     * Select first tab.
     *
     * @param {HTMLElement} target
     *   Clicked nav button.
     */
    #setSelectedToFirstTab(target) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const new_current_tab = tab_buttons[0];

        this.#setSelectedTab(target, new_current_tab);
    }

    /**
     * Select last tab.
     *
     * @param {HTMLElement} target
     *   Clicked nav button.
     */
    #setSelectedToLastTab(target) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const new_current_tab = tab_buttons[tab_buttons.length - 1];

        this.#setSelectedTab(target, new_current_tab);
    }

    /**
     * Move keyboard focus to the previous tab without changing the
     * active selection (manual activation mode).
     *
     * @param {HTMLElement} target
     *   Focused nav button.
     */
    #moveFocusToPreviousTab(target) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const current_tab_index = this.#getClickedTabIndex(tab_buttons, target);
        const new_current_tab = this.#getPreviousTab(current_tab_index, tab_buttons);

        this.#moveFocusTo(target, new_current_tab);
    }

    /**
     * Move keyboard focus to the next tab without changing the
     * active selection (manual activation mode).
     *
     * @param {HTMLElement} target
     *   Focused nav button.
     */
    #moveFocusToNextTab(target) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const current_tab_index = this.#getClickedTabIndex(tab_buttons, target);
        const new_current_tab = this.#getNextTab(current_tab_index, tab_buttons);

        this.#moveFocusTo(target, new_current_tab);
    }

    /**
     * Move keyboard focus to the first tab without changing the
     * active selection (manual activation mode).
     *
     * @param {HTMLElement} target
     *   Focused nav button.
     */
    #moveFocusToFirstTab(target) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const new_current_tab = tab_buttons[0];

        this.#moveFocusTo(target, new_current_tab);
    }

    /**
     * Move keyboard focus to the last tab without changing the
     * active selection (manual activation mode).
     *
     * @param {HTMLElement} target
     *   Focused nav button.
     */
    #moveFocusToLastTab(target) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const new_current_tab = tab_buttons[tab_buttons.length - 1];

        this.#moveFocusTo(target, new_current_tab);
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
     * Get previous tab element.
     *
     * @param {number} current_tab_index
     *   Current tab index.
     *
     * @param {NodeList} tab_buttons
     *   Nav buttons.
     *
     * @returns HTMLElement
     *   Return previous tab.
     */
    #getPreviousTab(current_tab_index, tab_buttons) {
        return (current_tab_index > 0) ? tab_buttons[current_tab_index - 1] : tab_buttons[tab_buttons.length - 1];
    }

    /**
     * Get next tab element.
     *
     * @param {number} current_tab_index
     *   Current tab index.
     *
     * @param {NodeList} tab_buttons
     *   Nav buttons.
     *
     * @returns HTMLElement
     *   Return next tab.
     */
    #getNextTab(current_tab_index, tab_buttons) {
        return (current_tab_index < tab_buttons.length - 1) ? tab_buttons[current_tab_index + 1] : tab_buttons[0];
    }

    /**
     * Prepared tab content by adding appropriate attributes.
     *
     * `hidden` is the semantic source of truth for panel visibility: it
     * hides inactive panels natively, without depending on bundled CSS.
     * The `tab-panel--open` class is kept in sync purely as a styling hook.
     */
    #prepareTabContent() {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];

        this.#objectsHTML['tabPanel'].forEach((item, index) => {
            const tab_panel_id = this.#panelIds[index];
            const open_class_selector = this.#configs.selectors.tabPanelOpen;
            const tab_panel_open_index = this.#configs.options.initSelectedItem;
            const is_selected = tab_panel_open_index === index;

            item.setAttribute('id', tab_panel_id);
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'tabpanel');
            item.hidden = !is_selected;

            if (tab_buttons[index]) {
                item.setAttribute('aria-labelledby', tab_buttons[index].id);
            }

            if (is_selected) {
                item.classList.add(open_class_selector);
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
    #insertNav() {
        if (!this.#configs.options.useCustomNav) {
            this.#objectsHTML['tabsNavContainer'][0].innerHTML = this.#createNav();
        } else {
            this.#preparedCustomNavButton();
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
        let title = '';

        if (this.#configs.options.customNavTitles.length) {
            title = this.#configs.options.customNavTitles[index];
        } else {
            let custom_title = this.#objectsHTML['tabPanelTitle'][index].getAttribute('data-nav-title');
            title = custom_title ?? this.#objectsHTML['tabPanelTitle'][index].innerText;
        }

        if (title === undefined) {
            title = '';
        }

        return title;
    }

    /**
     * Create default raw nav HTML.
     *
     * @returns {string}
     *   Return raw nav HTML.
     */
    #createNav() {
        const tab_nav_list_selector = this.#configs.classes.tabsNavList.substring(1);
        const tab_nav_btn_selector = this.#configs.classes.tabsNavButton.substring(1);
        const aria_label = this.#configs.options.ariaLabel;
        const aria_label_attr = aria_label ? ` aria-label="${aria_label}"` : '';
        const is_vertical = this.#configs.options.orientation === 'vertical';
        const aria_orientation_attr = is_vertical ? ` aria-orientation="vertical"` : '';

        let html = `<div class="${tab_nav_list_selector}" role="tablist"${aria_label_attr}${aria_orientation_attr}>`;

        for (let i = 0; i < this.#objectsHTML['tabPanelTitle'].length; i++) {
            let tab_panel_id = this.#panelIds[i];
            let tab_id = tab_panel_id + '-tab';
            let is_selected = this.#configs.options.initSelectedItem === i;

            html += `<button type="button" id="${tab_id}" class="${tab_nav_btn_selector}" role="tab" aria-selected="${is_selected ? 'true' : 'false'}" aria-controls="${tab_panel_id}">${this.#getNavTitle(i)}</button>`
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
    #preparedCustomNavButton() {
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
            let is_selected = this.#configs.options.initSelectedItem === i;

            if (!button.id) {
                button.setAttribute('id', tab_panel_id + '-tab');
            }

            if (button.tagName === 'BUTTON' && !button.hasAttribute('type')) {
                button.setAttribute('type', 'button');
            }

            button.setAttribute('aria-controls', tab_panel_id);
            button.setAttribute('aria-selected', 'false');


            if (is_selected) {
                button.setAttribute('aria-selected', 'true');
            }
        }
    }

    /**
     * Pre-compute a unique DOM id for each tab panel, so multiple Tabs
     * instances with the default tabPanelIdPrefix on the same page
     * don't collide (which would produce invalid duplicate-id HTML and
     * make document.getElementById resolve to the wrong instance).
     */
    #generatePanelIds() {
        const count = this.#objectsHTML['tabPanel'].length;
        const prefix = this.#configs.selectors.tabPanelIdPrefix;
        const ids = [];

        for (let i = 0; i < count; i++) {
            ids.push(this.#makeUniqueId(`${prefix}-${i}`));
        }

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

    /**
     * Merge deep two objects.
     *
     * @param {object} obj1
     *   Initial first object
     *
     * @param {object} obj2
     *   Second object to be merged to the first one.
     *
     * @returns {object}
     *   Return merged object.
     */
    #deepMerge(obj1, obj2) {
        const result = { ...obj1 };

        for (let key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                if (Array.isArray(obj2[key]) && Array.isArray(obj1[key])) {
                    // If both are arrays, concatenate them or handle as needed
                    result[key] = obj1[key].concat(obj2[key]);
                } else if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
                    // If both are objects, merge them recursively
                    result[key] = this.#deepMerge(obj1[key], obj2[key]);
                } else {
                    // Otherwise, just assign the value from obj2 to the result
                    result[key] = obj2[key];
                }
            }
        }

        return result;
    }
}

export default Tabs;
