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
     * initSelectedItem, missing panels/navigation/titles, or a custom
     * navigation/panel count mismatch).
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
     * Select a tab by index. Throws if no tab exists at that index.
     */
    selectTab(index: number): void;
}
