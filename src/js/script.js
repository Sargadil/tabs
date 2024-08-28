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
        }
    }

    constructor(configs) {
        this.#configs = this.#deepMerge(this.#configs, configs);
        this.#initElements();
        this.#initTabs();

        if (this.#configs.options.removeTabPanelTitle) {
            this.#removeTabPanelTitle();
        }
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
            tab_buttons[i].addEventListener('keydown', this.#onKeyDown.bind(this));
            tab_buttons[i].addEventListener('click', this.#onClick.bind(this));
        }

        this.#prepareTabContent();
    }

    /**
     * Do appropriate action based on click event.
     *
     * @param {PointerEvent} event
     *   Click event.
     */
    #onClick(event) {
        const new_tab = event.currentTarget;
        const old_tab = document.querySelector(`#${this.#configs.contextID} [aria-selected = "true"]`);

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
        let flag = false;

        switch (event.key) {
            case 'ArrowLeft':
                this.#setSelectedToPreviousTab(target);
                flag = true;
                break;
            case 'ArrowRight':
                this.#setSelectedToNextTab(target);
                flag = true;
                break;
            case 'Home':
                this.#setSelectedTab(target);
                flag = true;
                break;
            case 'End':
                this.#setSelectedTab(target);
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
     * Toggle tab panel.
     *
     * @param {HTMLElement} old_tab
     *   Old tab element.
     *
     * @param {HTMLElement} new_tab
     *   New tab element.
     */
    #setSelectedTab(old_tab, new_tab) {
        const old_panel_tab_id = old_tab.getAttribute(['aria-controls']);
        const new_panel_tab_id = new_tab.getAttribute(['aria-controls']);

        old_tab.setAttribute('aria-selected', 'false');
        old_tab.tabIndex = -1;
        new_tab.setAttribute('aria-selected', 'true');
        new_tab.tabIndex = 1;
        new_tab.focus();

        this.#toggleTabContent(old_panel_tab_id, new_panel_tab_id);
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

        this.#objectsHTML['tabPanel'].forEach((item, index) => {
            const tab_panel_id = this.#configs.selectors.tabPanelIdPrefix + '-' + index;
            const open_class_selector = this.#configs.selectors.tabPanelOpen;
            const tab_panel_open_index = this.#configs.options.initSelectedItem

            item.setAttribute('id', tab_panel_id);
            item.setAttribute('tabindex', '0');

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
            this.#objectsHTML['tabsNavContainer'][0].innerHTML = this.#createNav();
        } else {
            this.#preparedCustomNavButton();
        }

        this.#appendElement('tabsNavBtn', document.querySelectorAll(`#${this.#configs.contextID} [role = "tab"]`));
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

        let html = `<div class="${tab_nav_list_selector}" role="tablist">`;

        for (let i = 0; i < this.#objectsHTML['tabPanelTitle'].length; i++) {
            let tab_panel_id = this.#configs.selectors.tabPanelIdPrefix + '-' + i;
            let is_selected = parseInt(this.#configs.options.initSelectedItem) === i;

            html += `<button class="${tab_nav_btn_selector}" role="tab" aria-selected="${is_selected ? 'true' : 'false'}" aria-controls="${tab_panel_id}">${this.#getNavTitle(i)}</button>`
        }

        html += '</div>';
        return html;
    }

    /**
     * Prepared custom nav buttons by adding aria attributes.
     */
    #preparedCustomNavButton() {
        for (let i = 0; i < this.#objectsHTML['tabsNavButton'].length; i++) {
            let tab_panel_id = this.#configs.selectors.tabPanelIdPrefix + '-' + i;
            let is_selected = parseInt(this.#configs.options.initSelectedItem) === i;

            this.#objectsHTML['tabsNavButton'][i].setAttribute('aria-controls', tab_panel_id);
            this.#objectsHTML['tabsNavButton'][i].setAttribute('aria-selected', 'false');


            if (is_selected) {
                this.#objectsHTML['tabsNavButton'][i].setAttribute('aria-selected', 'true');
            }
        }
    }

    /**
     * Init HTML element based on configs css class selectors.
     */
    #initElements() {
        const classes = this.#configs.classes;
        const context  = document.getElementById(this.#configs.contextID);

        if (!context) {
            throw new Error(`[tabs plugin] contextID does not exist in html structure.`);
        }

        for (const el in classes) {
            let selectors = context.querySelectorAll(classes[el]);

            if (selectors.length === 0) {
                continue;
            }

            this.#objectsHTML[el] = selectors;
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tabs;
}
