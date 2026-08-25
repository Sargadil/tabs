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
}

export interface TabsConfig {
    contextID?: string;
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

declare global {
    interface HTMLElementEventMap {
        'tabs:change': TabsChangeEvent;
    }
}

export default class Tabs {
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
