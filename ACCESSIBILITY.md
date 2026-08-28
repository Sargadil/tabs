# Accessibility

`@sargadil/tabs` implements the [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
This document describes exactly what is implemented, how it was verified, and — just as
importantly — what has **not** been verified yet.

## ARIA structure

| Element | Role / attribute | Notes |
| --- | --- | --- |
| Nav container | `role="tablist"` | Set on the generated `.tabs__nav-list`, or on `classes.tabsNavList` when `useCustomNav` is used. |
| Tablist | `aria-label` | Only set if `options.ariaLabel` is provided. Recommended when a page has more than one tab group, so assistive technology can tell them apart. |
| Tablist | `aria-orientation="vertical"` | Only set when `options.orientation === 'vertical'`. Omitted for the (default) horizontal orientation, per the ARIA default. |
| Tab | `role="tab"` | Generated nav renders `<button type="button" role="tab">`. Custom nav (`useCustomNav: true`) requires the author to mark elements with `role="tab"`. |
| Tab | `aria-selected` | `"true"` on the active tab, `"false"` on all others. Exactly one tab is `"true"` at all times. |
| Tab | `aria-controls` | Points at the `id` of the tab's panel. |
| Tab | `tabindex` (roving) | `0` on the tab that is currently reachable by `Tab`, `-1` on all others. See [Keyboard behavior](#keyboard-behavior). |
| Panel | `role="tabpanel"` | Set on every element matching `classes.tabPanel`. |
| Panel | `aria-labelledby` | Points at the `id` of the tab that controls it. |
| Panel | `tabindex="0"` | Lets a panel receive focus directly (e.g. via `Shift+Tab` from content, or when a panel's first child isn't focusable), per the APG pattern. |
| Panel | `hidden` | The source of truth for visibility — see below. |

### `hidden` is the source of truth, not CSS

The inactive panels carry the native `hidden` attribute; the active panel does not. This means:

- Inactive panel content is removed from the accessibility tree and from tab order natively,
  by the browser, independent of any stylesheet.
- The component behaves correctly even if the bundled CSS never loads.
- The `tab-panel--open` class is kept in sync purely as a styling hook — it is not read by
  assistive technology and must never be the only thing hiding a panel.

`hidden` is updated synchronously with `aria-selected` on every interaction (click, keyboard
activation, `selectTab()`), so a screen reader never observes two panels exposed at once, even
momentarily.

### Unique IDs across multiple instances

Panel (and derived tab) IDs are generated per instance and de-duplicated against the rest of the
document, so two `Tabs` instances on the same page — each using the default ID prefix — don't
collide into invalid duplicate-`id` HTML, which would otherwise break `aria-controls` /
`aria-labelledby` references.

## Keyboard behavior

Keys are handled on the currently focused tab. `event.preventDefault()` is called for every key
below so the browser's default scroll behavior doesn't fight the widget.

| Key | Horizontal (LTR) | Horizontal (RTL) | Vertical | Automatic activation | Manual activation |
| --- | --- | --- | --- | --- | --- |
| `Tab` | Moves focus into/out of the tablist | Same | Same | Enters the tablist at the currently selected tab (roving tabindex); leaves the tablist to the active panel. | Same |
| `ArrowLeft` | Previous tab | Next tab | *(ignored)* | Selects and activates the previous/next tab (per direction), wrapping around. | Moves focus to the previous/next tab only (per direction); selection is unchanged. |
| `ArrowRight` | Next tab | Previous tab | *(ignored)* | Selects and activates the next/previous tab (per direction), wrapping around. | Moves focus to the next/previous tab only (per direction); selection is unchanged. |
| `ArrowUp` | *(ignored)* | *(ignored)* | Previous tab | Selects and activates the previous tab, wrapping from the first to the last. | Moves focus to the previous tab only; selection is unchanged. |
| `ArrowDown` | *(ignored)* | *(ignored)* | Next tab | Selects and activates the next tab, wrapping from the last to the first. | Moves focus to the next tab only; selection is unchanged. |
| `Home` | First tab | First tab | First tab | Selects and activates the first tab. | Moves focus to the first tab only; selection is unchanged. |
| `End` | Last tab | Last tab | Last tab | Selects and activates the last tab. | Moves focus to the last tab only; selection is unchanged. |
| `Enter` / `Space` | Activates the focused tab | Same | Same | *(no-op — the focused tab is already selected)* | Selects and activates the focused tab. |

Notes:

- "Selects and activates" means: a cancelable `tabs:beforechange` event fires first; unless a
  listener calls `preventDefault()` on it, `aria-selected` and the roving `tabindex` move
  together, the matching panel's `hidden` attribute is updated, focus moves to the newly selected
  tab, and a `tabs:change` event fires. If the transition is canceled, none of that happens and
  focus/selection/`hidden` state remain exactly as they were.
- Arrow-key wrap-around applies in both activation modes and both directions: from the last tab,
  next moves to the first; from the first tab, previous moves to the last — "next"/"previous"
  being `ArrowDown`/`ArrowUp` in vertical mode, and `ArrowRight`/`ArrowLeft` in horizontal LTR
  (reversed in horizontal RTL, see [RTL direction detection](#rtl-direction-detection)).
- `Enter`/`Space` activation is native `<button>` behavior — the default generated nav and every
  bundled example always render `<button type="button" role="tab">`. If `useCustomNav` is used
  with a non-button element (e.g. a `<div role="tab">`), the author is responsible for making
  that element focusable and for `Enter`/`Space` to trigger a `click`, since the component does
  not add its own `Enter`/`Space` handling on top of the native click listener. See
  [Known limitations](#known-limitations).

## Automatic vs. manual activation

Controlled by `options.activationMode`:

- **`automatic`** (default) — arrow keys / `Home` / `End` move focus **and** immediately select
  the tab, per the "selection follows focus" variant of the APG pattern. This is the more common
  choice, and the right default for tab panels that are already loaded and cheap to switch to.
- **`manual`** — arrow keys / `Home` / `End` only move focus (via the roving `tabindex`);
  selection changes only on `Enter`, `Space`, or a mouse click. Use this when switching a tab is
  expensive (e.g. it lazy-loads content over the network) — see the "Lazy-loading panel content"
  recipe in the [README](./README.md#lazy-loading-panel-content).

In both modes, `aria-selected`, the roving `tabindex`, and panel `hidden` state are always kept
consistent with each other — there is no intermediate state where, for example, `aria-selected`
has changed but the panel hasn't (or vice versa).

## RTL direction detection

Horizontal orientation (the default) reverses `ArrowLeft`/`ArrowRight` in a right-to-left
context, so the key that visually points toward the next tab always selects it. There is no
`options.rtl` flag — direction is read from the DOM itself, via the focused tab's cascaded CSS
`direction` property (`window.getComputedStyle(tab).direction`). This is exactly what the
browser's own UA stylesheet derives from `dir="rtl"` on `<html>` or on any closer ancestor (e.g.
a wrapper placed around just this tablist), so it works whether the whole document is RTL or
only this particular tab group is.

Vertical orientation is unaffected: `ArrowUp`/`ArrowDown` have no left/right reading direction to
flip. `Home`/`End` and wrap-around are also unaffected — see the table above.

## Disabled tabs

A tab is disabled the same way any native `<button>` or custom `role="tab"` element would be —
native `disabled` (preferred whenever the library renders the element itself, i.e. the default
nav) or `aria-disabled="true"` (for a custom-nav tab that isn't a `<button>`). No library-specific
attribute (e.g. `data-disabled`) is used.

A disabled tab is excluded from every interaction path:

- click, `Enter`, and `Space` do not activate it,
- `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown` skip over it, including when wrapping around,
- `Home`/`End` skip it in favor of the first/last *enabled* tab,
- a swipe (`options.swipeable`) skips it too, using the same adjacent-enabled-tab lookup as arrow-key
  navigation, including wrap-around,
- `selectTab()` throws instead of selecting it.

It still participates in the roving `tabindex` as a non-target — i.e. it's simply never assigned
`tabindex="0"` — and a native `disabled` button is additionally removed from the sequential focus
order and the "enabled" accessibility state by the browser itself, independent of anything this
library does.

A blocked click/`Enter`/`Space` on a disabled tab never dispatches
[`tabs:beforechange` or `tabs:change`](./README.md#tabsbeforechange) either — the disabled
check happens before either event would be raised, so a listener watching for selection attempts
will never see one aimed at a disabled tab.

The constructor rejects two configurations that would otherwise leave the widget in a broken
state: `options.initSelectedItem` pointing at a disabled tab, and every tab being disabled (a
tablist needs at least one selectable tab). See [Disabled tabs in the
README](./README.md#disabled-tabs) for the exact error messages and markup examples.

Disabling/enabling a tab after construction (or adding/removing tabs and panels) is not picked up
automatically; the consumer calls [`refresh()`](./README.md#dynamic-tabs) after changing the DOM.
`refresh()` re-synchronizes the ARIA relationships, roving `tabindex`, `hidden` panels, and
disabled state, keeps the active tab selected when its panel survives (with a documented fallback
when it doesn't), and only moves focus if focus was already inside the tablist.

## Automated testing

Three layers of automated tests exist. **None of them are a substitute for manual testing with
real assistive technology** — see [Manual assistive technology test matrix](#manual-assistive-technology-test-matrix).

- **Unit tests** (`npm test`, [`test/tabs.test.js`](./test/tabs.test.js)) — run against jsdom.
  Cover the ARIA attributes set on init, `hidden` as the source of truth for every interaction
  path (click, automatic keyboard activation, manual activation, `selectTab()`), roving
  `tabindex`, orientation, configuration validation, the cancelable `tabs:beforechange` event
  (detail contract, event order, and that canceling it via click/keyboard/`selectTab()` leaves
  focus/ARIA/`hidden`/selection untouched and suppresses `tabs:change`), disabled tabs (native
  `disabled` and `aria-disabled`, in default and custom nav, in both activation modes — click,
  arrow-key/Home/End skipping with wrap-around, `selectTab()`, and the two constructor validation
  errors), RTL direction detection (`<html dir="rtl">`, a local `dir="rtl"` wrapper, automatic and
  manual activation, wrap-around, `Home`/`End` unaffected, and vertical orientation unaffected),
  RTL combined with disabled tabs (reversed arrow-key skipping and `Home`/`End` under RTL, both
  activation modes, wrap-around past both disabled edges), that a blocked disabled-tab interaction
  never dispatches `tabs:beforechange`, that a swipe (`options.swipeable`) skips a disabled tab
  instead of throwing (including wrap-around past a disabled edge), `refresh()` (added/removed
  tabs and panels, removal of the active tab and its documented fallback, disabled-state changes,
  that repeated `refresh()` calls never duplicate listeners/events, focus handling, and that
  multiple instances stay independent), and that the component still
  resolves to the correct visible panel with no stylesheet loaded at all. CI and `prepublishOnly` run
  `npm run test:coverage` instead, which runs the same suite gated on 100% branch/function
  coverage.
- **Browser tests** (`npm run test:e2e`, [`e2e/`](./e2e)) — run with Playwright across Chromium,
  Firefox, and WebKit. Cover initialization, keyboard navigation in both orientations, RTL
  keyboard navigation ([`e2e/keyboard-rtl.spec.js`](./e2e/keyboard-rtl.spec.js) — automatic and
  manual activation, vertical orientation unaffected, direction detected from a local `dir="rtl"`
  wrapper as well as `<html dir="rtl">`, and RTL combined with disabled tabs), mouse click, manual
  activation, multiple instances on one page, `options.swipeable`
  ([`e2e/swipe.spec.js`](./e2e/swipe.spec.js) — including that a swipe skips a disabled tab instead
  of throwing), `options.removeTabPanelTitle`
  ([`e2e/initialization.spec.js`](./e2e/initialization.spec.js)), canceling `tabs:beforechange`
  ([`e2e/before-change.spec.js`](./e2e/before-change.spec.js)) — including that a real browser's
  mousedown-focuses-the-target behavior is correctly unwound on a canceled click — disabled tabs
  in default and custom nav and in manual mode ([`e2e/disabled-tabs.spec.js`](./e2e/disabled-tabs.spec.js)),
  including that a real click event arriving via `dispatchEvent` (the closest a test can get to a
  native disabled `<button>`, which Playwright's own actionability checks otherwise refuse to
  click) is still correctly ignored — `refresh()`
  ([`e2e/refresh.spec.js`](./e2e/refresh.spec.js) — picking up an added panel and driving it with
  mouse/keyboard, the active-tab-removal fallback, repeated `refresh()` not stacking listeners,
  focus staying put unless it was already in the tablist, a newly disabled tab, and an axe scan
  afterwards) — and the public API
  (`selectTab()`/`getSelectedIndex()`/`destroy()`/`tabs:beforechange`/`tabs:change`).
- **axe-core scans** (part of `npm run test:e2e`, [`e2e/accessibility.spec.js`](./e2e/accessibility.spec.js))
  — run via `@axe-core/playwright` against the default, manual, vertical, custom-nav, swipeable,
  disabled-tabs, RTL + disabled-tabs, swipeable + disabled-tabs, and multiple-instance fixtures,
  both on initial render and after interaction
  (click, keyboard, swipe).

axe-core only detects a subset of accessibility issues — [roughly a third of WCAG success
criteria are automatically testable at all](https://github.com/dequelabs/axe-core#user-content-what-does-axe-core-detect).
A zero-violation axe run means the markup contains no *detectable* ARIA/contrast/naming defects.
It does **not** mean the component is "fully WCAG compliant", and it says nothing about whether
the keyboard and focus behavior actually makes sense to someone using a screen reader — that can
only be established by the manual testing below.

## Known limitations

- **Custom navigation with non-button elements.** `Enter`/`Space` activation relies on the
  browser's native `click`-on-activation behavior for `<button>` elements (and, for `Enter` only,
  `<a href>`). If `useCustomNav` is used with an element that has neither (e.g. a plain
  `<div role="tab">` or `<span role="tab">`), the author must add their own `keydown` handling to
  translate `Enter`/`Space` into a click, or use a native interactive element instead.
- **No `aria-label` by default.** `options.ariaLabel` is opt-in. A page with a single, obviously-
  scoped tab group is usually fine without one, but pages with more than one tablist, or a
  tablist without adjacent visible context (e.g. a heading right before it), should set one.
- **Swipe gestures (`options.swipeable`) have no ARIA surface of their own.** They're an
  additional touch-only input path on top of the fully keyboard-accessible tablist, not a
  replacement for it, so they don't change anything in the tables above.
- **Panel content itself is the author's responsibility.** This document covers the tablist/
  panel shell that `@sargadil/tabs` renders and wires up — it says nothing about the accessibility
  of whatever markup an author places inside a `.tab-panel__content`.

## Manual assistive technology test matrix

Automated tests (above) catch regressions in markup and state transitions, but only a human
using real assistive technology can confirm the component is actually usable. The matrix below
is the tracked record of that verification.

**A row may only be marked `PASS` or `FAIL` after a human has actually run that combination.**
Nothing in this repository — including Claude or any other AI assistant — is permitted to mark a
row as `PASS` on its own; every row starts, and stays, `TBD` until a person records a real result
here (with the date and, ideally, a link to notes or an issue for any `FAIL`).

| OS | Browser | Assistive Technology | Status | Last tested |
| --- | --- | --- | --- | --- |
| macOS | Safari | VoiceOver | TBD | — |
| macOS | Chrome | VoiceOver | TBD | — |
| Windows | Chrome | NVDA | TBD | — |
| Windows | Firefox | NVDA | TBD | — |
| Windows | Chrome | JAWS | TBD | — |
| iOS | Safari | VoiceOver | TBD | — |
| Android | Chrome | TalkBack | TBD | — |

Suggested minimum check per row, using the [live demo](https://sargadil.github.io/tabs/), the
[`examples/`](./examples/) pages, or the `e2e/fixtures/` pages:

1. Tab into the tablist; confirm the AT announces a tab, its name, its selected state, and its
   position (e.g. "1 of 3").
2. Arrow through all tabs in both directions, including wrap-around at the first/last tab;
   confirm the announced selected state (and panel content, in automatic mode) tracks focus.
3. In manual mode, confirm arrowing does **not** announce a selection change, and that
   `Enter`/`Space` does.
4. Confirm the active panel's content is reachable and announced after switching tabs.
5. Repeat for the vertical orientation fixture, confirming `ArrowUp`/`ArrowDown` are used instead.

Update this table only from a real, human-run session — replace `TBD` with `PASS` or `FAIL`, and
fill in the date.
