/**
 * Configuration layer (MAINT-2).
 *
 * Owns the option defaults, the user-config merge, and every
 * configuration/structure validation rule — including the exact,
 * publicly documented `[@sargadil/tabs] ...` error messages.
 *
 * It deliberately knows nothing about selection, keyboard navigation,
 * events, or how to read/mutate the DOM. The orchestrator (`Tabs`)
 * performs element discovery and then hands this layer plain element
 * counts plus a disabled-state probe, so the rules can be validated in
 * isolation.
 *
 * Configuration/structure errors are raised through the shared
 * `internal/error.js` → `fail()`, so they follow the same convention as
 * every other library error.
 *
 * Internal module — not part of the public API. See
 * `src/js/internal/*` in ARCHITECTURE.md.
 */

import { fail } from './error.js';

/**
 * A fresh copy of the built-in configuration. A factory rather than a
 * shared constant, so each instance owns its own config tree — exactly
 * as the previous per-instance class field did.
 *
 * @returns {object}
 */
function createDefaultConfig() {
    return {
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
        },
    };
}

/**
 * Merge deep two objects.
 *
 * @param {object} obj1
 *   Initial first object.
 *
 * @param {object} obj2
 *   Second object to be merged into the first one.
 *
 * @returns {object}
 *   Return merged object.
 */
function deepMerge(obj1, obj2) {
    const result = { ...obj1 };

    for (let key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            if (Array.isArray(obj2[key]) && Array.isArray(obj1[key])) {
                // If both are arrays, concatenate them or handle as needed
                result[key] = obj1[key].concat(obj2[key]);
            } else if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
                // If both are objects, merge them recursively
                result[key] = deepMerge(obj1[key], obj2[key]);
            } else {
                // Otherwise, just assign the value from obj2 to the result
                result[key] = obj2[key];
            }
        }
    }

    return result;
}

/**
 * Produce the effective configuration: the caller's object merged over
 * the built-in defaults (objects recursively, arrays by concatenation,
 * everything else by replacement).
 *
 * @param {object} [userConfig]
 *   The configuration object passed to `new Tabs()`, if any.
 *
 * @returns {object}
 *   The merged configuration.
 */
export function mergeConfig(userConfig) {
    return deepMerge(createDefaultConfig(), userConfig);
}

/**
 * Validate the configuration values that don't require DOM access
 * (contextID's type, orientation, activationMode, initSelectedItem's
 * shape). Runs before element discovery, so every constructor call
 * fails fast on the same rules with the same error format.
 *
 * @param {object} configs
 *   The merged configuration.
 */
export function validateConfig(configs) {
    const context_id = configs.contextID;
    const options = configs.options;

    if (typeof context_id !== 'string' && !(context_id instanceof HTMLElement)) {
        fail(`"contextID" must be a string or an HTMLElement. Received ${typeof context_id}.`);
    }

    if (options.orientation !== 'horizontal' && options.orientation !== 'vertical') {
        fail(`"orientation" must be "horizontal" or "vertical". Received ${JSON.stringify(options.orientation)}.`);
    }

    if (options.activationMode !== 'automatic' && options.activationMode !== 'manual') {
        fail(`"activationMode" must be "automatic" or "manual". Received ${JSON.stringify(options.activationMode)}.`);
    }

    if (!Number.isInteger(options.initSelectedItem) || options.initSelectedItem < 0) {
        fail(`"initSelectedItem" must be an integer >= 0. Received ${JSON.stringify(options.initSelectedItem)}.`);
    }
}

/**
 * Validate the discovered DOM structure against the configuration. The
 * caller runs element discovery first and passes the resulting counts;
 * the structural checks run before `isSourceDisabled` is ever probed, so
 * a bad tab/panel count still fails with a friendly message rather than
 * an index error.
 *
 * @param {object} configs
 *   The merged configuration.
 *
 * @param {{panelCount: number, navButtonCount: number, navContainerCount: number, titleCount: number}} counts
 *   Element counts gathered by the orchestrator during discovery.
 *
 * @param {(index: number) => boolean} isSourceDisabled
 *   Probe for whether the tab at a given panel index is disabled in the
 *   as-authored DOM.
 *
 * @param {boolean} [isRefresh=false]
 *   True when called from `refresh()`, which relaxes the
 *   initSelectedItem / missing-title rules (they only apply at
 *   construction time).
 */
export function validateDomStructure(configs, counts, isSourceDisabled, isRefresh = false) {
    const classes = configs.classes;
    const options = configs.options;
    const panel_count = counts.panelCount;

    if (panel_count === 0) {
        fail(`No tab panels were found. Expected at least one element matching "${classes.tabPanel}".`);
    }

    // initSelectedItem only picks the tab shown at construction time; a
    // later refresh() resolves its own selected tab from the live DOM, so
    // it must not be re-measured against a now-shorter panel list.
    if (!isRefresh && options.initSelectedItem >= panel_count) {
        fail(`initSelectedItem ${options.initSelectedItem} is out of range. Found ${panel_count} tabs.`);
    }

    if (options.useCustomNav) {
        const tab_count = counts.navButtonCount;

        if (tab_count === 0) {
            fail(`No custom navigation elements were found. Expected at least one element matching "${classes.tabsNavButton}" (options.useCustomNav is true).`);
        }

        if (tab_count !== panel_count) {
            fail(`Custom navigation has ${tab_count} tab(s) but there are ${panel_count} panel(s). The counts must match.`);
        }
    } else {
        if (counts.navContainerCount === 0) {
            fail(`Tab navigation container was not found. Expected an element matching "${classes.tabsNavContainer}".`);
        }

        const title_count = counts.titleCount;

        // options.removeTabPanelTitle deletes every title element after
        // the first build, so on refresh() there is nothing left to
        // count — #getNavTitle() falls back to the cached labels.
        const skip_title_check = isRefresh && options.removeTabPanelTitle;

        if (!skip_title_check && title_count !== panel_count) {
            fail(`Expected ${panel_count} tab panel title(s) matching "${classes.tabPanelTitle}" (one per panel) but found ${title_count}. Each panel needs a title element; options.customNavTitles only overrides its displayed text.`);
        }
    }

    validateEnabledTabs(options, panel_count, isSourceDisabled, isRefresh);
}

/**
 * Validate that at least one tab is enabled, and that
 * options.initSelectedItem doesn't point at a disabled one. Runs after
 * the structural checks in validateDomStructure(), so it's safe to probe
 * every panel index here.
 *
 * @param {object} options
 *   configs.options.
 *
 * @param {number} panel_count
 *   Number of tab panels.
 *
 * @param {(index: number) => boolean} isSourceDisabled
 *   Disabled-state probe.
 *
 * @param {boolean} isRefresh
 *   True when called from refresh().
 */
function validateEnabledTabs(options, panel_count, isSourceDisabled, isRefresh) {
    let has_enabled_tab = false;

    for (let i = 0; i < panel_count; i++) {
        if (!isSourceDisabled(i)) {
            has_enabled_tab = true;
            break;
        }
    }

    if (!has_enabled_tab) {
        fail('At least one enabled tab is required.');
    }

    // Only meaningful at construction time — refresh() never re-reads
    // initSelectedItem (see #resolveSelectedIndex()).
    if (!isRefresh && isSourceDisabled(options.initSelectedItem)) {
        fail(`initSelectedItem ${options.initSelectedItem} is disabled. Choose an enabled tab as the initial tab.`);
    }
}
