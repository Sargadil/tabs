'use strict';

/**
 * HTML fixture builders for the unit suites.
 *
 * The goal is to stop repeating the standard `.tabs` markup, not to hide
 * what a test is about: panel/tab specs stay explicit, so which tab is
 * disabled, how many there are, and what they're labelled is still
 * visible at the call site. Deliberately malformed markup (a missing
 * title, a nav/panel count mismatch, an unusual tab element) belongs
 * inline in the test that checks it.
 */

// The `classes` that point Tabs at the custom-nav markup below.
const CUSTOM_NAV_CLASSES = {
    tabsNavContainer: '.custom-tabs__nav',
    tabsNavList: '.custom-tabs__nav-inner',
    tabsNavButton: '.custom-tabs__nav-button',
};

/**
 * The config object for a custom-nav instance: `new Tabs(customNavConfig())`,
 * or `customNavConfig({ orientation: 'vertical' })` to add options.
 *
 * @param {object} [options]
 * @returns {{classes: object, options: object}}
 */
function customNavConfig(options = {}) {
    return { classes: CUSTOM_NAV_CLASSES, options: { useCustomNav: true, ...options } };
}

/**
 * Render `.tab-panel` blocks. Each item is a title string or
 * `{ title, disabled?, content? }`. `content` defaults to the 1-based
 * index. With `navTitles: true` a `data-nav-title` is added so the
 * generated label is asserted-on in jsdom (which has no `innerText`).
 *
 * @param {(string|object)[]} items
 * @param {{navTitles?: boolean}} [opts]
 * @returns {string}
 */
function panels(items, { navTitles = false } = {}) {
    return items
        .map((item, index) => {
            const spec = typeof item === 'string' ? { title: item } : item;
            const content = spec.content ?? String(index + 1);
            const navTitle = navTitles ? ` data-nav-title="${spec.title}"` : '';
            const disabled = spec.disabled ? ' aria-disabled="true"' : '';

            return `<div class="tab-panel">`
                + `<h3 class="tab-panel__title"${navTitle}${disabled}>${spec.title}</h3>`
                + `<div class="tab-panel__content">${content}</div>`
                + `</div>`;
        })
        .join('');
}

/**
 * The default-nav container: an empty `.tabs__nav` for Tabs to fill, plus
 * the panels.
 *
 * @param {(string|object)[]} items       Passed to panels().
 * @param {{id?: string, navTitles?: boolean}} [opts]
 * @returns {string}
 */
function tabsHtml(items, { id = 'tabs', navTitles = false } = {}) {
    return `<div class="tabs" id="${id}">`
        + `<div class="tabs__nav"></div>`
        + `<div class="tabs__panels">${panels(items, { navTitles })}</div>`
        + `</div>`;
}

/**
 * The custom-nav container: the author's own tab elements plus the panels.
 * Each `tabs` item is a label string or `{ label, disabled?, tag? }`
 * (`tag` defaults to `'button'`; a `'div'` gets `tabindex="-1"`, and
 * `disabled` becomes `aria-disabled="true"` on non-buttons).
 *
 * @param {(string|object)[]} tabs
 * @param {(string|object)[]} items       Passed to panels().
 * @param {{id?: string, navTitles?: boolean}} [opts]
 * @returns {string}
 */
function customNavHtml(tabs, items, { id = 'tabs', navTitles = false } = {}) {
    const nav = tabs
        .map((tab) => {
            const spec = typeof tab === 'string' ? { label: tab } : tab;
            const tag = spec.tag ?? 'button';
            const roving = tag === 'button' ? '' : ' tabindex="-1"';
            const disabled = spec.disabled
                ? (tag === 'button' ? ' disabled' : ' aria-disabled="true"')
                : '';

            return `<${tag} class="custom-tabs__nav-button" role="tab"${roving}${disabled}>${spec.label}</${tag}>`;
        })
        .join('');

    return `<div class="tabs" id="${id}">`
        + `<div class="custom-tabs__nav"><div class="custom-tabs__nav-inner">${nav}</div></div>`
        + `<div class="tabs__panels">${panels(items, { navTitles })}</div>`
        + `</div>`;
}

// The two shapes used across most suites.
const DEFAULT_HTML = tabsHtml(['One', 'Two', 'Three']);
const CUSTOM_NAV_HTML = customNavHtml(['Tab 1', 'Tab 2'], ['One', 'Two']);

module.exports = {
    CUSTOM_NAV_CLASSES,
    customNavConfig,
    panels,
    tabsHtml,
    customNavHtml,
    DEFAULT_HTML,
    CUSTOM_NAV_HTML,
};
