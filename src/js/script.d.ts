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
}

export interface TabsConfig {
    contextID?: string;
    classes?: TabsClasses;
    selectors?: TabsSelectors;
    options?: TabsOptions;
}

export default class Tabs {
    constructor(configs?: TabsConfig);
}
