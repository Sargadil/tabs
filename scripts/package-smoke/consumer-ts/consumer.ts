/**
 * TypeScript consumer smoke fixture (MAINT-9).
 *
 * Compiled with `tsc --noEmit` against the *packed tarball* installed into the
 * throwaway fixture project — not against `src/`. It proves the shipped
 * `dist/js/tabs.d.ts` is what a real npm consumer would get:
 *
 *  - the default import resolves to the `Tabs` class,
 *  - the named type exports are reachable,
 *  - the public methods are typed as documented,
 *  - `orientation` / `activationMode` are closed unions, not `string`,
 *  - the `HTMLElementEventMap` augmentation types the custom events.
 *
 * The `// @ts-expect-error` lines are load-bearing: if the shipped types ever
 * loosened enough for one of those snippets to compile, tsc fails the build
 * with TS2578 ("unused '@ts-expect-error' directive").
 */

import Tabs, {
    TabsConfig,
    TabsOptions,
    TabsChangeEvent,
    TabsBeforeChangeEvent,
} from '@sargadil/tabs';

/* -------------------------------------------------------------------------- */
/* Valid usage — must compile                                                 */
/* -------------------------------------------------------------------------- */

const options: TabsOptions = {
    orientation: 'horizontal',
    activationMode: 'manual',
    swipeable: true,
};

const config: TabsConfig = {
    contextID: 'tabs',
    options,
};

const tabs = new Tabs(config);

tabs.selectTab(1);
tabs.refresh();

const selected: number = tabs.getSelectedIndex();
void selected;

tabs.destroy();

// The constructor argument is optional, and `contextID` also accepts an element.
new Tabs();
new Tabs({ contextID: document.createElement('div') });

// The HTMLElementEventMap augmentation gives the listener a typed `detail`.
const host: HTMLElement = document.createElement('div');

host.addEventListener('tabs:change', (event) => {
    const changed: TabsChangeEvent = event;
    const index: number = changed.detail.index;
    const panel: HTMLElement = changed.detail.panel;
    void index;
    void panel;
});

host.addEventListener('tabs:beforechange', (event) => {
    const beforeChange: TabsBeforeChangeEvent = event;
    const fromIndex: number = beforeChange.detail.fromIndex;
    const toIndex: number = beforeChange.detail.toIndex;
    void fromIndex;
    void toIndex;
});

/* -------------------------------------------------------------------------- */
/* Invalid usage — every line below must stay a type error                    */
/* -------------------------------------------------------------------------- */

// @ts-expect-error - orientation is a closed union, not an arbitrary string
const badOrientation: TabsOptions = { orientation: 'diagonal' };
void badOrientation;

// @ts-expect-error - activationMode is a closed union
const badActivation: TabsOptions = { activationMode: 'auto' };
void badActivation;

// @ts-expect-error - unknown options are rejected
const unknownOption: TabsOptions = { autoplay: true };
void unknownOption;

// @ts-expect-error - selectTab expects a number
tabs.selectTab('1');

// @ts-expect-error - refresh takes no arguments
tabs.refresh(1);

// @ts-expect-error - getSelectedIndex returns number, not string
const wrongReturnType: string = tabs.getSelectedIndex();
void wrongReturnType;

// @ts-expect-error - contextID must be a string or HTMLElement
new Tabs({ contextID: 123 });
