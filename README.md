# @sargadil/tabs

[![npm version](https://img.shields.io/npm/v/@sargadil/tabs.svg)](https://www.npmjs.com/package/@sargadil/tabs)
[![npm downloads](https://img.shields.io/npm/dm/@sargadil/tabs.svg)](https://www.npmjs.com/package/@sargadil/tabs)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@sargadil/tabs)](https://bundlephobia.com/package/@sargadil/tabs)
[![license](https://img.shields.io/npm/l/@sargadil/tabs.svg)](./LICENSE)
[![CI](https://github.com/Sargadil/tabs/actions/workflows/ci.yml/badge.svg)](https://github.com/Sargadil/tabs/actions/workflows/ci.yml)

Lightweight, dependency-free tabs following the [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
Navigable by mouse and keyboard, framework-agnostic, TypeScript declarations included.

> Formerly published as `tabs-a11y`. That package is deprecated in favor of this one — see
> [Migrating from `tabs-a11y`](#migrating-from-tabs-a11y).

**[Live demo](https://sargadil.github.io/tabs/)** ·
**[Runnable examples](./examples/)** ·
**[Accessibility contract](./ACCESSIBILITY.md)**

## What it is

`@sargadil/tabs` builds an accessible tab interface from plain markup: it generates the tab
buttons (or adopts your own), keeps the ARIA state and a roving `tabindex` in sync, and handles
keyboard, mouse, and optional touch interaction. It's a single ~3.7 kB (min+gzip) file, ships as
ESM / CJS / UMD, and has zero runtime dependencies.

It implements the [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) — it is
not a "fully WCAG-compliant" black box. See [Accessibility](#accessibility) for what it does and
does not guarantee.

## Features

- WAI-ARIA Tabs Pattern: `tablist`/`tab`/`tabpanel`, `aria-selected`/`aria-controls`/`aria-labelledby`,
  roving `tabindex`, native `hidden` panels
- Full keyboard support — arrow keys, `Home`/`End`, `Enter`/`Space` — in **automatic** or
  **manual** activation mode
- **Horizontal** or **vertical** orientation
- **RTL**-aware: arrow keys follow reading direction, detected from the DOM (no flag to set)
- **Disabled tabs** via native `disabled` / `aria-disabled` — no library-specific attribute
- **Custom navigation**: bring your own nav markup instead of having it generated
- **Cancelable** tab changes (`tabs:beforechange`) plus a `tabs:change` event
- **Dynamic DOM**: `refresh()` to resync after you add or remove tabs — no `MutationObserver`
- Optional touch **swipe** between tabs
- Works **without the bundled CSS** — `hidden` is the source of truth for panel visibility
- TypeScript declarations included; zero runtime dependencies

## Installation

### npm

```bash
npm install @sargadil/tabs
```

```javascript
import Tabs from '@sargadil/tabs';
import '@sargadil/tabs/style.css';

new Tabs();
```

CommonJS works too: `const Tabs = require('@sargadil/tabs');`

### CDN (no build step)

```html
<link rel="stylesheet" href="https://unpkg.com/@sargadil/tabs/dist/css/styles.min.css">
<script src="https://unpkg.com/@sargadil/tabs/dist/js/tabs.umd.js"></script>
```

or jsDelivr:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sargadil/tabs/dist/css/styles.min.css">
<script src="https://cdn.jsdelivr.net/npm/@sargadil/tabs/dist/js/tabs.umd.js"></script>
```

Both expose a `Tabs` global. Pin a version for production, e.g.
`https://unpkg.com/@sargadil/tabs@1.2.0/...`, instead of always fetching the latest.

## Basic usage

Provide the container, an empty nav element, and one `.tab-panel` per tab — each with a
`.tab-panel__title` whose text becomes the tab button:

```html
<div class="tabs" id="tabs">
    <div class="tabs__nav"></div>
    <div class="tabs__panels">
        <div class="tab-panel">
            <h3 class="tab-panel__title">Overview</h3>
            <div class="tab-panel__content">…</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Features</h3>
            <div class="tab-panel__content">…</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Pricing</h3>
            <div class="tab-panel__content">…</div>
        </div>
    </div>
</div>
```

```javascript
import Tabs from '@sargadil/tabs';

new Tabs(); // contextID defaults to 'tabs'
```

That is the whole setup — everything below is optional. More self-contained examples, one per
use case, are in [`examples/`](./examples/).

## CSS

Include `@sargadil/tabs/style.css` (`dist/css/styles.min.css`) for the default look. It is a
styling layer only — panel visibility is driven by the native `hidden` attribute, so the
component still shows exactly one panel at a time without it.

- Below 600px wide the nav becomes a horizontally scrollable strip (instead of wrapping) so the
  tab content is never pushed off-screen on a phone.
- The bundled CSS respects `prefers-color-scheme: dark` and exposes CSS custom properties
  (`--tabs-nav-bg`, `--tabs-surface-bg`, `--tabs-text-color`, `--tabs-focus-color`, …) scoped to
  `.tabs`, which you can override to reskin the component.
- For [vertical orientation](#configuration), also add the `tabs--vertical` class to the
  container to lay the nav beside the panels instead of above them:

  ```html
  <div class="tabs tabs--vertical" id="tabs">
  ```

## Configuration

`new Tabs()` accepts an optional configuration object. Defaults:

```javascript
{
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
```

| Option                      | Type    | Description                                                                                                                     |
|-----------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------|
| contextID                   | string \| HTMLElement | Main container: either its `id` (string), or a direct reference to the element — useful for elements without an `id` or created dynamically. |
| classes.tabsNavContainer    | string  | Navigation container CSS class. Only relevant with custom navigation.                                                            |
| classes.tabsNavList         | string  | Navigation list CSS class. Only relevant with custom navigation.                                                                 |
| classes.tabsNavButton       | string  | Navigation button CSS class. Only relevant with custom navigation.                                                               |
| classes.tabPanel            | string  | Single tab panel CSS class.                                                                                                     |
| classes.tabPanelTitle       | string  | Panel title CSS class. Its text is copied into the generated nav button.                                                         |
| selectors.tabPanelIdPrefix  | string  | ID prefix used to build the `aria-controls`/`aria-labelledby` wiring. Safe to leave at the default even with multiple instances on one page — a numeric suffix is added automatically on collision. |
| selectors.tabPanelOpen      | string  | CSS class added to the active panel as a styling hook. Panel visibility itself is controlled by the native `hidden` attribute, not this class. |
| options.useCustomNav        | boolean | Use existing navigation markup instead of generating it. See [Disabled tabs](#disabled-tabs) and the [custom navigation example](./examples/custom-navigation.html). Requires the `classes.tabsNav*` selectors to point at your markup. |
| options.customNavTitles     | array   | Override the generated button labels, in order. To override a single tab instead, put a `data-nav-title` attribute on its `.tab-panel__title`. |
| options.initSelectedItem    | number  | Zero-based index of the tab open on initialization.                                                                             |
| options.removeTabPanelTitle | boolean | Remove the `.tab-panel__title` element from the panel once its text has been copied into the nav button.                        |
| options.ariaLabel           | string  | Accessible name (`aria-label`) for the tablist, e.g. `"Product details"`. Recommended when a page has more than one tab group.  |
| options.orientation         | string  | `'horizontal'` (default; `ArrowLeft`/`ArrowRight`, direction-aware — see [RTL](#rtl)) or `'vertical'` (`ArrowUp`/`ArrowDown`, sets `aria-orientation="vertical"`). Changes keyboard/ARIA only — add the `tabs--vertical` class for the matching layout. |
| options.activationMode      | string  | `'automatic'` (default) selects a tab as soon as it is focused. `'manual'` moves focus with the arrow keys / `Home` / `End` without selecting; the focused tab activates on click, `Enter`, or `Space`. |
| options.swipeable           | boolean | `false` by default. When `true`, swiping left/right on a panel (touchscreens) moves to the next/previous tab, skipping [disabled tabs](#disabled-tabs) the same way arrow-key navigation does. |

`contextID` also accepts an element directly, which is handy when it was not created with an `id`:

```javascript
const container = document.querySelector('.my-tabs');

new Tabs({ contextID: container });
```

### Configuration validation

The constructor validates its configuration and the required DOM structure up front, and throws a
descriptive `[@sargadil/tabs] ...` error — naming the offending option or selector — instead of an
unrelated low-level exception. This covers:

- `contextID` (must be a string or an `HTMLElement`, and must resolve to an existing element),
- `options.orientation` (must be `'horizontal'` or `'vertical'`),
- `options.activationMode` (must be `'automatic'` or `'manual'`),
- `options.initSelectedItem` (must be an integer, `>= 0`, and less than the number of tabs),
- required DOM structures (at least one `.tab-panel`, a title element per panel, and — for the
  default nav — a `.tabs__nav` container),
- custom navigation (`options.useCustomNav: true`) having at least one nav element, with its count
  matching the number of panels,
- at least one tab must not be [disabled](#disabled-tabs),
- `options.initSelectedItem` must not point at a disabled tab.

There is no silent recovery from an invalid configuration — fix the reported field and re-run.

## API

### `destroy()`

Removes all event listeners added by the instance. Call this before discarding a `Tabs` instance
(e.g. on component unmount in React or Vue) to avoid leaking listeners.

```javascript
const tabs = new Tabs();

// later, e.g. when the component unmounts
tabs.destroy();
```

### `selectTab(index)`

Programmatically select a tab by zero-based index. Throws if no tab exists at that index, or if
the tab at that index is [disabled](#disabled-tabs).

```javascript
const tabs = new Tabs();

tabs.selectTab(2);
```

### `getSelectedIndex()`

Returns the zero-based index of the currently selected tab (`-1` if no tab is selected).

```javascript
const tabs = new Tabs();

tabs.getSelectedIndex(); // 0
```

### `refresh()`

Re-synchronizes the instance with the current DOM after you have added or removed tabs/panels, or
toggled a tab's [disabled](#disabled-tabs) state. See [Dynamic tabs](#dynamic-tabs) for the full
behavior and an example.

```javascript
const tabs = new Tabs();

// after your code has added/removed .tab-panel elements
tabs.refresh();
```

## Events

Both events bubble and are dispatched on the main container element.

### `tabs:beforechange`

Dispatched (cancelable) right before the selected tab changes, whether triggered by mouse,
keyboard, or `selectTab()`. Call `preventDefault()` on it to block the transition entirely —
`aria-selected`, the roving `tabindex`, the `hidden` panels, focus, and the selected index are
all left exactly as they were, and `tabs:change` does not fire.

```javascript
document.getElementById('tabs').addEventListener('tabs:beforechange', (event) => {
    const { fromIndex, toIndex, fromTab, toTab, fromPanel, toPanel } = event.detail;

    if (toIndex === 2) {
        event.preventDefault(); // keep the current tab selected
    }
});
```

A click, `Enter`, or `Space` blocked by a [disabled tab](#disabled-tabs) never dispatches this
event — the disabled check happens first.

### `tabs:change`

Dispatched whenever the selected tab changes — via mouse, keyboard, or `selectTab()` — and only
when the transition was not canceled by a `tabs:beforechange` listener. Useful for analytics or
lazy-loading panel content.

```javascript
document.getElementById('tabs').addEventListener('tabs:change', (event) => {
    const { index, tab, panel } = event.detail;

    console.log('Selected tab index:', index);
});
```

## Accessibility

`@sargadil/tabs` implements the [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):
`tablist`/`tab`/`tabpanel` roles, `aria-selected`/`aria-controls`/`aria-labelledby`, a roving
`tabindex`, and native `hidden` panels, with full keyboard support (arrow keys, `Home`/`End`,
`Enter`/`Space`) in both automatic and manual activation modes, including [RTL](#rtl) and
correctly skipping [disabled tabs](#disabled-tabs).

**[Read the full accessibility contract in `ACCESSIBILITY.md` →](./ACCESSIBILITY.md)** — exact
ARIA/keyboard tables, what the automated test suite (unit tests, Playwright, axe-core) does and
does not cover, known limitations, and the manual assistive-technology test matrix.

## RTL

Horizontal tabs (`options.orientation: 'horizontal'`, the default) automatically reverse
`ArrowLeft`/`ArrowRight` in a right-to-left context, so the key that visually points toward the
next tab always selects it, regardless of language:

| | `ArrowLeft` | `ArrowRight` |
|---|---|---|
| LTR (default) | Previous tab | Next tab |
| RTL | Next tab | Previous tab |

Direction is detected from the DOM — there is no `options.rtl` flag. Either of the following is
enough:

```html
<html dir="rtl">
```

```html
<div dir="rtl">
    <div class="tabs" id="tabs">…</div>
</div>
```

`Home`/`End` (first/last tab) and wrap-around are unaffected by direction. Vertical orientation
(`ArrowUp`/`ArrowDown`) is also unaffected — a top-to-bottom list has no left/right reading
direction to flip.

## Disabled tabs

A tab can be disabled using the same mechanism a native `<button>` or a custom `role="tab"`
element would already use — there is no library-specific attribute to learn.

For the **default nav**, mark the panel's title with `aria-disabled="true"`; the generated tab
becomes a real `<button disabled>` (native `disabled` is preferred over ARIA whenever the library
controls the element it renders):

```html
<div class="tab-panel">
    <h3 class="tab-panel__title" aria-disabled="true">Billing</h3>
    <div class="tab-panel__content">…</div>
</div>
```

For **custom navigation** (`options.useCustomNav: true`), disable the tab element the same way you
would outside of `@sargadil/tabs` — the library only reads what is already there:

```html
<button class="custom-tabs__nav-button" role="tab" disabled>Billing</button>
<div class="custom-tabs__nav-button" role="tab" tabindex="-1" aria-disabled="true">Settings</div>
```

A disabled tab, regardless of which mechanism marked it:

- does not activate on click, `Enter`, or `Space`,
- is skipped by `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown` (including wrap-around),
- is skipped by `Home`/`End`,
- is skipped by a swipe (`options.swipeable`), including wrap-around,
- cannot be selected with `selectTab()` — it throws
  `[@sargadil/tabs] Cannot select disabled tab at index 2.` instead.

Two configurations are rejected at construction time:

- `options.initSelectedItem` pointing at a disabled tab —
  `[@sargadil/tabs] initSelectedItem 2 is disabled. Choose an enabled tab as the initial tab.`,
- every tab being disabled — `[@sargadil/tabs] At least one enabled tab is required.`.

Toggling a tab's disabled state after construction is not picked up automatically — call
[`refresh()`](#dynamic-tabs) after changing it.

## Dynamic tabs

When your own code changes the tabs/panels markup after construction — an AJAX or CMS fragment
swap, an HTMX update, a framework re-render, or just toggling a tab's
[disabled](#disabled-tabs) state — call `refresh()` to re-synchronize the instance with the new
DOM. The DOM stays your responsibility; there is deliberately no `addTab()`/`removeTab()` and no
automatic `MutationObserver`.

```javascript
const tabs = new Tabs();
const panels = document.querySelector('#tabs .tabs__panels');

// add a panel (default nav: include a `.tab-panel__title` — it becomes the tab label)
panels.insertAdjacentHTML('beforeend',
    '<div class="tab-panel"><h3 class="tab-panel__title">Reports</h3><div class="tab-panel__content">…</div></div>');

// …or remove one
document.getElementById('tabpanel-1').remove();

tabs.refresh();
```

`refresh()`:

- detects added and removed tabs/panels, and drops removed ones from the instance's state,
- moves event listeners off removed elements and onto new ones, without ever binding an element
  twice — calling `refresh()` repeatedly will not make events fire multiple times,
- re-synchronizes the ARIA relationships (`aria-controls`/`aria-labelledby`), the panel ids, and
  the disabled state,
- keeps the currently active tab selected if its panel still exists. If that panel was removed,
  the tab that took its position becomes active (or the new last tab, if the removed one was
  last), skipping disabled tabs,
- only moves focus if focus was already inside the tablist (it follows the active tab across the
  rebuild); it never steals focus otherwise,
- does not dispatch [`tabs:beforechange`](#tabsbeforechange) or [`tabs:change`](#tabschange).

Multiple instances on one page stay independent — refreshing one does not touch the others.

If the refreshed DOM is no longer valid (every panel removed, every tab disabled, a custom
navigation/panel count mismatch), `refresh()` throws the same `[@sargadil/tabs] …` error the
constructor would.

## Recipes

These are not extra config options — just the existing API put together for a few common needs.
For runnable versions, see [`examples/`](./examples/) and the
[live demo](https://sargadil.github.io/tabs/).

### React

`contextID` accepts an element directly, so a ref works without needing an `id`. Call `destroy()`
in the effect's cleanup so listeners do not leak across remounts.

```jsx
import { useEffect, useRef } from 'react';
import Tabs from '@sargadil/tabs';

function TabsWidget() {
    const containerRef = useRef(null);

    useEffect(() => {
        const tabs = new Tabs({ contextID: containerRef.current });

        return () => tabs.destroy();
    }, []);

    return (
        <div className="tabs" ref={containerRef}>
            {/* ...tabs__nav / tabs__panels markup... */}
        </div>
    );
}
```

### Vue

Same idea with the Composition API — create it in `onMounted`, clean it up in `onUnmounted`.

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import Tabs from '@sargadil/tabs';

const containerRef = ref(null);
let tabs;

onMounted(() => {
    tabs = new Tabs({ contextID: containerRef.value });
});

onUnmounted(() => {
    tabs.destroy();
});
</script>

<template>
    <div class="tabs" ref="containerRef">
        <!-- ...tabs__nav / tabs__panels markup... -->
    </div>
</template>
```

### Syncing the active tab with the URL

Useful for documentation-style pages where a tab should be linkable/bookmarkable and support the
browser's back/forward buttons.

```javascript
const tabs = new Tabs();
const container = document.getElementById('tabs');

// Restore from the URL on load.
const initialIndex = Number(location.hash.slice(1));
if (!Number.isNaN(initialIndex)) {
    tabs.selectTab(initialIndex);
}

// Keep the URL in sync when the user switches tabs.
container.addEventListener('tabs:change', (event) => {
    history.replaceState(null, '', `#${event.detail.index}`);
});

// Support the browser's back/forward buttons.
window.addEventListener('hashchange', () => {
    const index = Number(location.hash.slice(1));

    if (!Number.isNaN(index) && index !== tabs.getSelectedIndex()) {
        tabs.selectTab(index);
    }
});
```

### Lazy-loading panel content

Combine `activationMode: 'manual'` with `tabs:change` — the event only fires when a tab is
actually activated (click, `Enter`, `Space`, or `selectTab()`), not while arrow keys are just
moving focus, so you only fetch data for a tab the user actually opened. Runnable version:
[`examples/events.html`](./examples/events.html).

## Browser support

Works in modern evergreen browsers (Chrome, Edge, Firefox, Safari). The test suite runs on
Chromium, Firefox, and WebKit via Playwright on every push. The code uses standard ES2020+
features (private class fields, optional chaining) with no polyfills; there is no Internet
Explorer support.

## Development

```bash
git clone https://github.com/Sargadil/tabs.git
cd tabs
npm ci

npm run build          # dist/js/*.{cjs,mjs,umd.js,d.ts} + dist/css/styles.min.css
npm run test:coverage  # unit tests, gated at 100% branch/function
npm run test:package   # packs the tarball and verifies the real publish artifact
npm run test:e2e       # Playwright + axe on Chromium, Firefox, WebKit
npm run examples       # static server for examples/ (http://127.0.0.1:4173/examples/)
```

- Contributing guidelines and quality gates: [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md)
- Project background and non-goals: [`docs/PROJECT.md`](./docs/PROJECT.md) ·
  [`docs/NON-GOALS.md`](./docs/NON-GOALS.md)
- Working with a coding agent on this repo: [`AGENTS.md`](./AGENTS.md)
- Accessibility contract: [`ACCESSIBILITY.md`](./ACCESSIBILITY.md)

`dist/` is committed but generated — never edit it by hand; run `npm run build`.

## Migrating from `tabs-a11y`

This package was previously published as `tabs-a11y`. `@sargadil/tabs` is its direct continuation
under a new name — same API, same behavior. `tabs-a11y` is deprecated; please switch to
`@sargadil/tabs` for future updates.

```diff
- import Tabs from 'tabs-a11y';
+ import Tabs from '@sargadil/tabs';
```

```diff
- <script src="https://unpkg.com/tabs-a11y/dist/js/tabs-a11y.umd.js"></script>
+ <script src="https://unpkg.com/@sargadil/tabs/dist/js/tabs.umd.js"></script>
```

```diff
- import 'tabs-a11y/style.css';
+ import '@sargadil/tabs/style.css';
```

## License

MIT © Bartosz Trajder. See [LICENSE](./LICENSE).
