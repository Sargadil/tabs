export interface TabsClasses {
    tabsNavContainer?: string;
    tabsNavList?: string;
    tabsNavButton?: string;
    tabPanel?: string;
    tabPanelTitle?: string;
}

export interface TabsSelectors {
    tabPanelIdPrefix?: string;
    tabPanelOpen?: string;
}

export interface TabsOptions {
    useCustomNav?: boolean;
    customNavTitles?: string[];
    initSelectedItem?: number;
    removeTabPanelTitle?: boolean;
    ariaLabel?: string;
    orientation?: 'horizontal' | 'vertical';
    activationMode?: 'automatic' | 'manual';
    swipeable?: boolean;
}

export interface TabsConfig {
    contextID?: string | HTMLElement;
    classes?: TabsClasses;
    selectors?: TabsSelectors;
    options?: TabsOptions;
}

export interface TabsChangeEventDetail {
    index: number;
    tab: HTMLElement;
    panel: HTMLElement;
}

export type TabsChangeEvent = CustomEvent<TabsChangeEventDetail>;

export interface TabsBeforeChangeEventDetail {
    fromIndex: number;
    toIndex: number;
    fromTab: HTMLElement;
    toTab: HTMLElement;
    fromPanel: HTMLElement;
    toPanel: HTMLElement;
}

export type TabsBeforeChangeEvent = CustomEvent<TabsBeforeChangeEventDetail>;

declare global {
    interface HTMLElementEventMap {
        'tabs:change': TabsChangeEvent;
        'tabs:beforechange': TabsBeforeChangeEvent;
    }
}

export default class Tabs {
    /**
     * Throws a `[@sargadil/tabs] ...` error if the configuration or the
     * required DOM structure is invalid (e.g. an unknown contextID, an
     * invalid orientation/activationMode, an out-of-range
     * initSelectedItem, missing panels/navigation/titles, a custom
     * navigation/panel count mismatch, every tab being disabled, or
     * initSelectedItem pointing at a disabled tab).
     */
    constructor(configs?: TabsConfig);

    /**
     * Remove all event listeners added by this instance. Call this
     * before discarding a Tabs instance (e.g. on component unmount)
     * to avoid leaking listeners.
     */
    destroy(): void;

    /**
     * Get the index of the currently selected tab, or -1 if none is selected.
     */
    getSelectedIndex(): number;

    /**
     * Select a tab by index. Throws if no tab exists at that index, or
     * if the tab at that index is disabled (native `disabled` or
     * `aria-disabled="true"`).
     */
    selectTab(index: number): void;

    /**
     * Re-synchronize the instance with the current DOM after the consumer
     * has added or removed tabs/panels, or toggled a tab's disabled state.
     *
     * Re-reads panels and navigation, re-validates the structure, moves
     * event listeners off removed elements and onto new ones (never
     * binding one twice), and re-synchronizes the ARIA relationships,
     * panel ids, and disabled state. The active tab stays selected if its
     * panel still exists; otherwise the tab now at its position becomes
     * active (or the new last tab, if the removed one was last), skipping
     * disabled tabs. Focus only moves if it was already inside the
     * tablist. Dispatches no `tabs:beforechange`/`tabs:change` event.
     *
     * Throws a `[@sargadil/tabs] ...` error if the refreshed DOM is no
     * longer valid (e.g. every panel removed, every tab disabled, or a
     * custom navigation/panel count mismatch).
     */
    refresh(): void;
}
