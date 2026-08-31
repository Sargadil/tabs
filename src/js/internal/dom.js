/**
 * DOM / ARIA layer (MAINT-4).
 *
 * Low-level helpers that read and mutate the DOM: element discovery, id
 * generation, navigation markup, and ARIA / `tabindex` / `hidden`
 * synchronization.
 *
 * They represent state in the DOM but never decide *which* tab that
 * state should describe — the orchestrator (`Tabs`) resolves the selected
 * index, the button labels, and the disabled flags, and passes them in.
 *
 * Internal module — not part of the public API. See `src/js/internal/*`
 * in docs/ARCHITECTURE.md.
 */

// ---------------------------------------------------------------- reads

/**
 * Whether a tab element is disabled: native `disabled` (buttons,
 * preferred) or `aria-disabled="true"` (custom non-button tabs).
 *
 * @param {HTMLElement} tab
 *
 * @returns {boolean}
 */
export function isTabDisabled(tab) {
    return tab.disabled === true || tab.getAttribute('aria-disabled') === 'true';
}

/**
 * Whether `element`'s cascaded CSS `direction` is right-to-left — exactly
 * what the UA stylesheet derives from `dir="rtl"` on `<html>` or any
 * closer ancestor, so the page's markup stays the single source of truth
 * for direction (no `options.rtl` flag).
 *
 * @param {HTMLElement} element
 *
 * @returns {boolean}
 */
export function isRtl(element) {
    return element.ownerDocument.defaultView.getComputedStyle(element).direction === 'rtl';
}

/**
 * Whether the tab at panel index `index` is disabled in the as-authored
 * DOM, before the default nav has been generated. Custom nav reads the
 * author's own tab element; the default nav reads `aria-disabled="true"`
 * off the panel's title element (no tab element exists yet).
 *
 * @param {{useCustomNav: boolean, navButtons: NodeList, panels: NodeList, titleSelector: string}} source
 * @param {number} index
 *
 * @returns {boolean}
 */
export function isSourceDisabled(source, index) {
    if (source.useCustomNav) {
        return isTabDisabled(source.navButtons[index]);
    }

    const title = source.panels[index].querySelector(source.titleSelector);

    return title ? title.getAttribute('aria-disabled') === 'true' : false;
}

/**
 * Index of the tab currently marked `aria-selected="true"`, or -1.
 *
 * @param {NodeList} tab_buttons
 *
 * @returns {number}
 */
export function selectedIndex(tab_buttons) {
    return Array.from(tab_buttons).findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
}

/**
 * Index of the tab that controls the same panel as `target` (i.e. the
 * tab the event fired on), matched by `aria-controls`.
 *
 * @param {NodeList} tab_buttons
 * @param {HTMLElement} target
 *
 * @returns {number}
 */
export function tabIndexByControls(tab_buttons, target) {
    return Array.from(tab_buttons).findIndex(
        (tab) => tab.getAttribute('aria-controls') === target.getAttribute('aria-controls'),
    );
}

/**
 * The panel a tab controls, or null when there is no such tab (e.g.
 * nothing was selected before a refresh()).
 *
 * @param {HTMLElement} [tab]
 * @param {Document} doc
 *
 * @returns {HTMLElement|null}
 */
export function panelForTab(tab, doc) {
    return tab ? doc.getElementById(tab.getAttribute('aria-controls')) : null;
}

/**
 * The label a title element contributes to its nav button: an explicit
 * `data-nav-title`, otherwise the element's rendered text.
 *
 * @param {HTMLElement} title_element
 *
 * @returns {string|undefined}
 */
export function titleText(title_element) {
    return title_element.getAttribute('data-nav-title') ?? title_element.innerText;
}

// ------------------------------------------------------------ discovery

/**
 * Query the context element for each configured class selector.
 *
 * @param {HTMLElement} context
 * @param {Object<string, string>} classes
 *
 * @returns {Object<string, NodeList>}
 */
export function discoverElements(context, classes) {
    const elements = {};

    for (const name in classes) {
        elements[name] = context.querySelectorAll(classes[name]);
    }

    return elements;
}

/**
 * Every `role="tab"` element inside the context (the generated buttons,
 * or the author's own in custom-nav mode).
 *
 * @param {HTMLElement} context
 *
 * @returns {NodeList}
 */
export function queryTabButtons(context) {
    return context.querySelectorAll('[role = "tab"]');
}

// -------------------------------------------------------- id generation

/**
 * `base_id`, or `base_id` with an incrementing numeric suffix if an
 * element with that id already exists elsewhere in the document (e.g.
 * from another Tabs instance on the same page).
 *
 * @param {string} base_id
 * @param {Document} doc
 *
 * @returns {string}
 */
function makeUniqueId(base_id, doc) {
    let id = base_id;
    let suffix = 2;

    while (doc.getElementById(id)) {
        id = `${base_id}-${suffix}`;
        suffix++;
    }

    return id;
}

/**
 * Give every panel a stable id and return the list of ids in order.
 * Keeps an id a panel already has — its own from a previous build, or one
 * the consumer set — so refresh() doesn't rename surviving panels (and
 * break bookmarked in-page links). Only newly added panels get a fresh
 * id, made unique against the whole document.
 *
 * @param {NodeList} panels
 * @param {string} prefix
 * @param {Document} doc
 *
 * @returns {string[]}
 */
export function ensurePanelIds(panels, prefix, doc) {
    const ids = [];

    panels.forEach((panel, index) => {
        if (!panel.id) {
            panel.id = makeUniqueId(`${prefix}-${index}`, doc);
        }

        ids.push(panel.id);
    });

    return ids;
}

// --------------------------------------------------------- nav markup

/**
 * Build the default `<div role="tablist">…<button role="tab">…</div>`
 * markup. Pure string builder — no DOM access.
 *
 * @param {{
 *   panelIds: string[],
 *   navTitles: Array<string|undefined>,
 *   disabledFlags: boolean[],
 *   selectedIndex: number,
 *   listClass: string,
 *   buttonClass: string,
 *   ariaLabel: string,
 *   vertical: boolean,
 * }} spec
 *
 * @returns {string}
 */
export function buildNavHtml(spec) {
    const aria_label_attr = spec.ariaLabel ? ` aria-label="${spec.ariaLabel}"` : '';
    const aria_orientation_attr = spec.vertical ? ` aria-orientation="vertical"` : '';

    let html = `<div class="${spec.listClass}" role="tablist"${aria_label_attr}${aria_orientation_attr}>`;

    for (let i = 0; i < spec.panelIds.length; i++) {
        const tab_id = spec.panelIds[i] + '-tab';
        const is_selected = spec.selectedIndex === i;
        const disabled_attr = spec.disabledFlags[i] ? ' disabled' : '';

        html += `<button type="button" id="${tab_id}" class="${spec.buttonClass}" role="tab" aria-selected="${is_selected ? 'true' : 'false'}" aria-controls="${spec.panelIds[i]}"${disabled_attr}>${spec.navTitles[i]}</button>`;
    }

    return html + '</div>';
}

/**
 * Adopt the author's existing navigation: set the tablist role / label /
 * orientation, and on each tab the id (if missing), `type="button"` (for
 * a `<button>` without one, so it can't submit an enclosing `<form>`),
 * and `aria-controls` / `aria-selected`.
 *
 * @param {{
 *   tablist: HTMLElement|undefined,
 *   navButtons: NodeList,
 *   panelIds: string[],
 *   selectedIndex: number,
 *   ariaLabel: string,
 *   vertical: boolean,
 * }} spec
 */
export function adoptCustomNav(spec) {
    if (spec.tablist) {
        spec.tablist.setAttribute('role', 'tablist');

        if (spec.ariaLabel) {
            spec.tablist.setAttribute('aria-label', spec.ariaLabel);
        }

        if (spec.vertical) {
            spec.tablist.setAttribute('aria-orientation', 'vertical');
        }
    }

    for (let i = 0; i < spec.navButtons.length; i++) {
        const button = spec.navButtons[i];

        if (!button.id) {
            button.setAttribute('id', spec.panelIds[i] + '-tab');
        }

        if (button.tagName === 'BUTTON' && !button.hasAttribute('type')) {
            button.setAttribute('type', 'button');
        }

        button.setAttribute('aria-controls', spec.panelIds[i]);
        button.setAttribute('aria-selected', spec.selectedIndex === i ? 'true' : 'false');
    }
}

// ---------------------------------------------------- panel / tab state

/**
 * Sync every panel to `selectedIndex`: id, `tabindex="0"`,
 * `role="tabpanel"`, `hidden` (the source of truth for visibility), the
 * styling-hook class, and `aria-labelledby`.
 *
 * @param {{
 *   panels: NodeList,
 *   panelIds: string[],
 *   tabButtons: NodeList,
 *   selectedIndex: number,
 *   openClass: string,
 * }} spec
 */
export function syncPanels(spec) {
    spec.panels.forEach((panel, index) => {
        const is_selected = spec.selectedIndex === index;

        panel.setAttribute('id', spec.panelIds[index]);
        panel.setAttribute('tabindex', '0');
        panel.setAttribute('role', 'tabpanel');
        panel.hidden = !is_selected;
        panel.classList.toggle(spec.openClass, is_selected);

        if (spec.tabButtons[index]) {
            panel.setAttribute('aria-labelledby', spec.tabButtons[index].id);
        }
    });
}

/**
 * Move visibility from `old_panel` to `new_panel`. `hidden` is the source
 * of truth; the class is a styling hook kept in sync. `hidden` is never
 * delayed for animation purposes.
 *
 * @param {HTMLElement} old_panel
 * @param {HTMLElement} new_panel
 * @param {string} open_class
 */
export function togglePanels(old_panel, new_panel, open_class) {
    old_panel.classList.remove(open_class);
    old_panel.hidden = true;

    new_panel.classList.add(open_class);
    new_panel.hidden = false;
}

/**
 * Roving tabindex: `0` on the tab at `selectedIndex`, `-1` on the rest.
 *
 * @param {NodeList} tab_buttons
 * @param {number} selected_index
 */
export function applyRovingTabIndex(tab_buttons, selected_index) {
    for (let i = 0; i < tab_buttons.length; i++) {
        tab_buttons[i].tabIndex = selected_index === i ? 0 : -1;
    }
}

/**
 * Apply a selection change to the tabs: `aria-selected` and the roving
 * `tabindex` move from `old_tab` to `new_tab`, and focus follows. Panel
 * visibility is the caller's job (see togglePanels()).
 *
 * @param {HTMLElement} old_tab
 * @param {HTMLElement} new_tab
 */
export function markSelected(old_tab, new_tab) {
    old_tab.setAttribute('aria-selected', 'false');
    old_tab.tabIndex = -1;
    new_tab.setAttribute('aria-selected', 'true');
    new_tab.tabIndex = 0;
    new_tab.focus();
}

/**
 * Move the roving tabindex and keyboard focus to `new_tab` without
 * touching `aria-selected` or panel visibility (manual activation mode).
 *
 * @param {HTMLElement} old_tab
 * @param {HTMLElement} new_tab
 */
export function moveRovingFocus(old_tab, new_tab) {
    old_tab.tabIndex = -1;
    new_tab.tabIndex = 0;
    new_tab.focus();
}

/**
 * Remove every node in the list from the DOM.
 *
 * @param {NodeList} nodes
 */
export function removeAll(nodes) {
    nodes.forEach((node) => node.remove());
}
