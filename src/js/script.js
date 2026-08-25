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
        this.#initElements();
        this.#generatePanelIds();
        this.#initTabs();

        if (this.#configs.options.removeTabPanelTitle) {
            this.#removeTabPanelTitle();
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
            throw new Error(`[tabs plugin] selectTab: no tab exists at index ${index}.`);
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

            tab_buttons[i].tabIndex = parseInt(this.#configs.options.initSelectedItem) === i ? 0 : -1;
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

        const old_panel_tab_id = old_tab.getAttribute(['aria-controls']);
        const new_panel_tab_id = new_tab.getAttribute(['aria-controls']);

        old_tab.setAttribute('aria-selected', 'false');
        old_tab.tabIndex = -1;
        new_tab.setAttribute('aria-selected', 'true');
        new_tab.tabIndex = 0;
        new_tab.focus();

        this.#toggleTabContent(old_panel_tab_id, new_panel_tab_id);
        this.#dispatchChangeEvent(new_tab, new_panel_tab_id);
    }

    /**
     * Dispatch a "tabs:change" CustomEvent on the context element.
     *
     * @param {HTMLElement} tab
     *   Newly selected tab button.
     *
     * @param {string} panel_id
     *   ID of the newly selected tab panel.
     */
    #dispatchChangeEvent(tab, panel_id) {
        const tab_buttons = this.#objectsHTML['tabsNavBtn'];
        const index = Array.prototype.indexOf.call(tab_buttons, tab);
        const panel = document.getElementById(panel_id);

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
     */
    #prepareTabContent() {
        if (this.#objectsHTML['tabPanel'].length === 0) {
            throw new Error(`[tabs plugin] tab panels should exist.`);
        }

        const tab_buttons = this.#objectsHTML['tabsNavBtn'];

        this.#objectsHTML['tabPanel'].forEach((item, index) => {
            const tab_panel_id = this.#panelIds[index];
            const open_class_selector = this.#configs.selectors.tabPanelOpen;
            const tab_panel_open_index = this.#configs.options.initSelectedItem

            item.setAttribute('id', tab_panel_id);
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'tabpanel');

            if (tab_buttons[index]) {
                item.setAttribute('aria-labelledby', tab_buttons[index].id);
            }

            if (tab_panel_open_index === index) {
                item.classList.add(open_class_selector);
            }
        });
    }

    /**
     * Toggle open tab panel css class.
     *
     * @param {string} old_panel_tab_id
     *   Old panel tab id name.
     *
     * @param {string} new_panel_tab_id
     *   New panel tab id name.
     */
    #toggleTabContent(old_panel_tab_id, new_panel_tab_id) {
        const open_selector = this.#configs.selectors.tabPanelOpen;

        document.getElementById(old_panel_tab_id).classList.remove(open_selector);
        document.getElementById(new_panel_tab_id).classList.add(open_selector);
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
            if (this.#objectsHTML['tabsNavContainer'].length === 0) {
                throw new Error(`[tabs plugin] tabsNavContainer element should exist.`);
            }

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
            let is_selected = parseInt(this.#configs.options.initSelectedItem) === i;

            html += `<button id="${tab_id}" class="${tab_nav_btn_selector}" role="tab" aria-selected="${is_selected ? 'true' : 'false'}" aria-controls="${tab_panel_id}">${this.#getNavTitle(i)}</button>`
        }

        html += '</div>';
        return html;
    }

    /**
     * Prepared custom nav buttons by adding aria attributes.
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
            let is_selected = parseInt(this.#configs.options.initSelectedItem) === i;

            if (!button.id) {
                button.setAttribute('id', tab_panel_id + '-tab');
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
            throw new Error(`[tabs plugin] contextID does not exist in html structure.`);
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
