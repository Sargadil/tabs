# @sargadil/tabs

[![npm version](https://img.shields.io/npm/v/@sargadil/tabs.svg)](https://www.npmjs.com/package/@sargadil/tabs)
[![npm downloads](https://img.shields.io/npm/dm/@sargadil/tabs.svg)](https://www.npmjs.com/package/@sargadil/tabs)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@sargadil/tabs)](https://bundlephobia.com/package/@sargadil/tabs)
[![license](https://img.shields.io/npm/l/@sargadil/tabs.svg)](./LICENSE)
[![CI](https://github.com/Sargadil/tabs/actions/workflows/ci.yml/badge.svg)](https://github.com/Sargadil/tabs/actions/workflows/ci.yml)

Lightweight, dependency-free tabs following the [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). The tabs can be navigated using both a mouse and a keyboard. The package also includes various configuration options.

> Formerly published as `tabs-a11y`. That package is deprecated in favor of this one — see
> [Migrating from `tabs-a11y`](#migrating-from-tabs-a11y) below.

**[Live demo](https://sargadil.github.io/tabs/)** — try it before installing.

## Basic usage

### Without npm

Via CDN (unpkg):
```html
<link rel="stylesheet" href="https://unpkg.com/@sargadil/tabs/dist/css/styles.min.css">
<script src="https://unpkg.com/@sargadil/tabs/dist/js/tabs.umd.js"></script>
```

or jsDelivr:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sargadil/tabs/dist/css/styles.min.css">
<script src="https://cdn.jsdelivr.net/npm/@sargadil/tabs/dist/js/tabs.umd.js"></script>
```

Both expose a `Tabs` global. Pin a version for production use, e.g.
`https://unpkg.com/@sargadil/tabs@1.2.0/...`, instead of always fetching the latest.

Or, without a CDN:
- Navigate to the project repository and download it. Place it in the appropriate directory, such as a library folder
- Include the following scripts:
  - js: `@sargadil/tabs/dist/js/tabs.umd.js` (exposes a `Tabs` global)
  - css: `@sargadil/tabs/dist/css/styles.min.css`

### With npm

#### Add css
Include the css file from `dist/css/styles.min.css`. Below 600px wide, the nav becomes a
horizontally scrollable strip (instead of wrapping, or staying a tall vertical list with
`tabs--vertical`) so the tab content never gets pushed out of view on a phone.

#### Create HTML structure
```html
<div class="tabs" id="tabs">
    <div class="tabs__nav"></div>
    <div class="tabs__panels">
        <div class="tab-panel">
            <h3 class="tab-panel__title">Aliquid architecto</h3>
            <div class="tab-panel__content">Assumenda dolores est fuga id iure minima non rem repellat, ullam voluptatem.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Consectetur deserunt</h3>
            <div class="tab-panel__content">Accusantium adipisci animi consectetur delectus dolor dolores, magni molestiae nulla odit quo saepe suscipit unde.</div>
        </div>
        <div class="tab-panel">
            <h3 class="tab-panel__title">Ducimus</h3>
            <div class="tab-panel__content">In libero molestiae odio odit perferendis praesentium repellat sed vero voluptatum? Eius quidem recusandae sapiente?</div>
        </div>
    </div>
</div>
```

#### Add javascript
Include the js file from `dist/js/tabs.umd.js`

or

```javascript
//commonjs
const Tabs = require('@sargadil/tabs');

new Tabs();
```

```javascript
//esm
import Tabs from '@sargadil/tabs';

new Tabs();
```

## API

### `destroy()`
Removes all event listeners added by the instance. Call this before discarding a `Tabs`
instance (e.g. on component unmount in a framework like React or Vue) to avoid leaking
listeners.

```javascript
const tabs = new Tabs();

// later, e.g. when the component unmounts
tabs.destroy();
```

### `selectTab(index)`
Programmatically select a tab by index (0-based). Throws if no tab exists at that index, or if
the tab at that index is [disabled](#disabled-tabs).

```javascript
const tabs = new Tabs();

tabs.selectTab(2);
```

### `getSelectedIndex()`
Returns the index of the currently selected tab.

```javascript
const tabs = new Tabs();

tabs.getSelectedIndex(); // 0
```

### `refresh()`
Re-synchronizes the instance with the current DOM after you've added or removed tabs/panels, or
toggled a tab's [disabled](#disabled-tabs) state. See [Dynamic tabs](#dynamic-tabs) for the full
behavior and an example.

```javascript
const tabs = new Tabs();

// after your code has added/removed .tab-panel elements
tabs.refresh();
```

### `tabs:beforechange` event
Dispatched (bubbling, cancelable) on the main container element right before the selected tab
changes, whether triggered by mouse, keyboard, or `selectTab()`. Call `preventDefault()` on it to
block the transition entirely — `aria-selected`, `tabindex`, the `hidden` panels, focus, and the
selected index are all left exactly as they were, and `tabs:change` does not fire.

```javascript
document.getElementById('tabs').addEventListener('tabs:beforechange', (event) => {
    const { fromIndex, toIndex, fromTab, toTab, fromPanel, toPanel } = event.detail;

    if (toIndex === 2) {
        event.preventDefault(); // keep the current tab selected
    }
});
```

### `tabs:change` event
Dispatched (bubbling) on the main container element whenever the selected tab changes,
whether triggered by mouse, keyboard, or `selectTab()` — and only when the transition wasn't
canceled by a `tabs:beforechange` listener. Useful for analytics or for lazy-loading panel content.

```javascript
document.getElementById('tabs').addEventListener('tabs:change', (event) => {
    const { index, tab, panel } = event.detail;

    console.log('Selected tab index:', index);
});
```

## Configuration

### Configuration object

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

### Configuration description

| Option                      | Type    | Description                                                                                                                     |
|-----------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------|
| contextID                   | string \| HTMLElement | Main container: either its `id` (string), or a direct reference to the element — useful for elements without an `id` or created dynamically. |
| classes.tabsNavContainer    | string  | Navigation tabs container css class. Use this only when you want create custom navigation.                                      |
| classes.tabsNavList         | string  | Navigation tabs list css class. Use this only when you want create custom navigation.                                           |
| classes.tabsNavButton       | string  | Navigation tabs buttons css class. Use this only when you want create custom navigation.                                        |
| classes.tabPanel            | string  | Single tab panel css class.                                                                                                     |
| classes.tabPanelTitle       | string  | Single tab title panel css class. This text will be copy to navigation button.                                                  |
| selectors.tabPanelIdPrefix  | string  | Selector that will be used as ID prefix to add correct aria structure for accessibility. Safe to leave at the default even with multiple `Tabs` instances on the same page — a numeric suffix is added automatically if it would otherwise collide. |
| selectors.tabPanelOpen      | string  | CSS class added to the active panel as a styling hook. Panel visibility itself is controlled by the native `hidden` attribute, not this class, so the component works correctly even without the bundled CSS. |
| options.useCustomNav        | boolean | Indicate if should use custom tabs navigation. Important note is that you have to put your css classes to configuration object. |
| options.customNavTitles     | array   | Array with custom titles.                                                                                                       |
| options.initSelectedItem    | number  | Indicate which tab should be open on initial state. Count start from 0.                                                         |
| options.removeTabPanelTitle | boolean | Indicate if we should remove title from tab panel that will be moved to navigation tab buttons.                                 |
| options.ariaLabel           | string  | Accessible name (`aria-label`) for the tablist, e.g. `"Product details"`. Recommended when a page has more than one tab group.  |
| options.orientation         | string  | `'horizontal'` (default, `ArrowLeft`/`ArrowRight`, direction-aware — see [RTL support](#rtl-support)) or `'vertical'` (`ArrowUp`/`ArrowDown`, sets `aria-orientation="vertical"`).  |
| options.activationMode      | string  | `'automatic'` (default) selects a tab as soon as it receives focus. `'manual'` moves focus with the arrow keys/Home/End without selecting; the focused tab is only activated on click, Enter, or Space. |
| options.swipeable           | boolean | `false` by default. When `true`, swiping left/right on a panel (touchscreens) moves to the next/previous tab, skipping [disabled tabs](#disabled-tabs) the same way arrow-key navigation does. |

`orientation` only changes keyboard/ARIA behaviour, not layout. When using `'vertical'`, also add
the `tabs--vertical` class to the main container to lay the nav beside the panels instead of above
them (provided by the bundled `dist/css/styles.min.css`):

```html
<div class="tabs tabs--vertical" id="tabs">
```

Use `activationMode: 'manual'` when selecting a tab is expensive (e.g. it lazy-loads content) —
see the [`tabs:change`](#tabschange-event) event to hook into that.

`contextID` also accepts an element directly, which is handy when it wasn't created with an `id`:

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

There's no silent recovery from an invalid configuration — fix the reported field and re-run.

## RTL support

Horizontal tabs (`options.orientation: 'horizontal'`, the default) automatically reverse
`ArrowLeft`/`ArrowRight` in a right-to-left context, so the key that visually points toward the
next tab always selects it, regardless of language:

| | `ArrowLeft` | `ArrowRight` |
|---|---|---|
| LTR (default) | Previous tab | Next tab |
| RTL | Next tab | Previous tab |

Direction is detected from the DOM — there is no `options.rtl` flag to set. Either of the
following is enough:

```html
<html dir="rtl">
```

```html
<div dir="rtl">
    <div class="tabs" id="tabs">…</div>
</div>
```

`Home`/`End` (first/last tab) and wrap-around behavior are unaffected by direction. Vertical
orientation (`ArrowUp`/`ArrowDown`) is also unaffected — a top-to-bottom list doesn't have a
left/right reading direction to flip.

## Disabled tabs

A tab can be disabled using the same mechanism a native `<button>` or a custom `role="tab"`
element would already use — there's no library-specific attribute to learn.

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
would outside of `@sargadil/tabs` — the library only reads what's already there:

```html
<button class="custom-tabs__nav-button" role="tab" disabled>Billing</button>
<div class="custom-tabs__nav-button" role="tab" tabindex="-1" aria-disabled="true">Settings</div>
```

A disabled tab, regardless of which of the two mechanisms above marked it:

- does not activate on click, `Enter`, or `Space`,
- is skipped by `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown` (including wrap-around),
- is skipped by `Home`/`End`,
- is skipped by a swipe (`options.swipeable`), including wrap-around,
- cannot be selected with `selectTab()` — it throws
  `[@sargadil/tabs] Cannot select disabled tab at index 2.` instead.

A click, `Enter`, or `Space` blocked by a disabled tab never dispatches
[`tabs:beforechange`](#tabsbeforechange-event) either — the disabled check happens first, so a
`tabs:beforechange` listener never sees an attempt to select a disabled tab.

Two configurations are rejected at construction time, with the same friendly error format as the
rest of [configuration validation](#configuration-validation):

- `options.initSelectedItem` pointing at a disabled tab —
  `[@sargadil/tabs] initSelectedItem 2 is disabled. Choose an enabled tab as the initial tab.`,
- every tab being disabled — `[@sargadil/tabs] At least one enabled tab is required.`.

Toggling a tab's disabled state after construction (e.g. in response to app state) is not
picked up automatically — call [`refresh()`](#dynamic-tabs) after changing it.

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
- does not dispatch [`tabs:beforechange`](#tabsbeforechange-event) or
  [`tabs:change`](#tabschange-event).

Multiple instances on one page stay independent — refreshing one does not touch the others.

If the refreshed DOM is no longer valid (every panel removed, every tab disabled, a custom
navigation/panel count mismatch), `refresh()` throws the same `[@sargadil/tabs] …` error the
constructor would.

## Accessibility

`@sargadil/tabs` implements the [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):
`tablist`/`tab`/`tabpanel` roles, `aria-selected`/`aria-controls`/`aria-labelledby`, a roving
`tabindex`, and native `hidden` panels, with full keyboard support (arrow keys, `Home`/`End`,
`Enter`/`Space`) in both automatic and manual activation modes, including [RTL](#rtl-support) and
correctly skipping [disabled tabs](#disabled-tabs).

**[Read the full accessibility contract in `ACCESSIBILITY.md` →](./ACCESSIBILITY.md)** — exact
ARIA/keyboard tables, what the automated test suite (unit tests, Playwright, axe-core) does and
does not cover, known limitations, and the manual assistive technology test matrix.

## More examples

**[See every option in action, live, with the code for each one →](https://sargadil.github.io/tabs/)**

Vertical orientation, manual activation, custom nav markup, custom titles, swipeable panels, and
the responsive nav are all demonstrated there with a "Show code" panel under each one. One
technique that's markup-only and not on that page: you can put the **`data-nav-title`** attribute
on a panel's `.tab-panel__title` to override just that tab's button text, instead of listing every
title in `options.customNavTitles`.

For small, self-contained pages you can open and read one at a time — basic setup, manual
activation, vertical, RTL, disabled tabs, custom navigation, `tabs:beforechange`, `tabs:change`,
`refresh()`, and multiple instances — see **[`examples/`](./examples/)**.

## Recipes

These aren't extra config options — they're just the existing API (`destroy()`, `selectTab()`,
`getSelectedIndex()`, `contextID` as an element, and the `tabs:change` event) put together for a
few common needs, so you don't have to figure it out from scratch.

### Using it in React
`contextID` accepts an element directly, so a ref works fine without needing an `id`. Call
`destroy()` in the effect's cleanup function so listeners don't leak across remounts.

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

### Using it in Vue
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
actually activated (click, Enter, Space, or `selectTab()`), not while arrow keys are just moving
focus between tabs, so you only fetch data for a tab the user actually opened. Runnable version:
[`examples/events.html`](./examples/events.html).

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
