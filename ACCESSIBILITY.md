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

| Key | Horizontal | Vertical | Automatic activation | Manual activation |
| --- | --- | --- | --- | --- |
| `Tab` | Moves focus into/out of the tablist | Same | Enters the tablist at the currently selected tab (roving tabindex); leaves the tablist to the active panel. | Same |
| `ArrowLeft` | Previous tab | *(ignored)* | Selects and activates the previous tab, wrapping from the first to the last. | Moves focus to the previous tab only; selection is unchanged. |
| `ArrowRight` | Next tab | *(ignored)* | Selects and activates the next tab, wrapping from the last to the first. | Moves focus to the next tab only; selection is unchanged. |
| `ArrowUp` | *(ignored)* | Previous tab | Selects and activates the previous tab, wrapping from the first to the last. | Moves focus to the previous tab only; selection is unchanged. |
| `ArrowDown` | *(ignored)* | Next tab | Selects and activates the next tab, wrapping from the last to the first. | Moves focus to the next tab only; selection is unchanged. |
| `Home` | First tab | First tab | Selects and activates the first tab. | Moves focus to the first tab only; selection is unchanged. |
| `End` | Last tab | Last tab | Selects and activates the last tab. | Moves focus to the last tab only; selection is unchanged. |
| `Enter` / `Space` | Activates the focused tab | Same | *(no-op — the focused tab is already selected)* | Selects and activates the focused tab. |

Notes:

- "Selects and activates" means: a cancelable `tabs:beforechange` event fires first; unless a
  listener calls `preventDefault()` on it, `aria-selected` and the roving `tabindex` move
  together, the matching panel's `hidden` attribute is updated, focus moves to the newly selected
  tab, and a `tabs:change` event fires. If the transition is canceled, none of that happens and
  focus/selection/`hidden` state remain exactly as they were.
- Arrow-key wrap-around applies in both activation modes: from the last tab, next/`ArrowDown`/
  `ArrowRight` moves to the first; from the first tab, previous/`ArrowUp`/`ArrowLeft` moves to
  the last.
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

## Automated testing

Three layers of automated tests exist. **None of them are a substitute for manual testing with
real assistive technology** — see [Manual assistive technology test matrix](#manual-assistive-technology-test-matrix).

- **Unit tests** (`npm test`, [`test/tabs.test.js`](./test/tabs.test.js)) — run against jsdom.
  Cover the ARIA attributes set on init, `hidden` as the source of truth for every interaction
  path (click, automatic keyboard activation, manual activation, `selectTab()`), roving
  `tabindex`, orientation, configuration validation, the cancelable `tabs:beforechange` event
  (detail contract, event order, and that canceling it via click/keyboard/`selectTab()` leaves
  focus/ARIA/`hidden`/selection untouched and suppresses `tabs:change`), and that the component
  still resolves to the correct visible panel with no stylesheet loaded at all. CI and
  `prepublishOnly` run `npm run test:coverage` instead, which runs the same suite gated on 100%
  branch/function coverage.
- **Browser tests** (`npm run test:e2e`, [`e2e/`](./e2e)) — run with Playwright across Chromium,
  Firefox, and WebKit. Cover initialization, keyboard navigation in both orientations, mouse
  click, manual activation, multiple instances on one page, `options.swipeable`
  ([`e2e/swipe.spec.js`](./e2e/swipe.spec.js)), `options.removeTabPanelTitle`
  ([`e2e/initialization.spec.js`](./e2e/initialization.spec.js)), canceling `tabs:beforechange`
  ([`e2e/before-change.spec.js`](./e2e/before-change.spec.js)) — including that a real browser's
  mousedown-focuses-the-target behavior is correctly unwound on a canceled click — and the public
  API (`selectTab()`/`getSelectedIndex()`/`destroy()`/`tabs:beforechange`/`tabs:change`).
- **axe-core scans** (part of `npm run test:e2e`, [`e2e/accessibility.spec.js`](./e2e/accessibility.spec.js))
  — run via `@axe-core/playwright` against the default, manual, vertical, custom-nav, swipeable,
  and multiple-instance fixtures, both on initial render and after interaction (click, keyboard,
  swipe).

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
- **RTL is not yet handled.** `ArrowLeft`/`ArrowRight` currently always map to previous/next
  regardless of document or element direction; correct RTL behavior is tracked separately
  (ROADMAP-8) and not implemented yet.
- **Disabled tabs are not yet a first-class concept.** There is no built-in support for
  `disabled`/`aria-disabled` tabs that keyboard navigation and `selectTab()` correctly skip
  (tracked separately, ROADMAP-10). Do not rely on disabling a tab via `disabled`/
  `aria-disabled` today — it is not wired into navigation or `selectTab()`.
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

Suggested minimum check per row, using the [live demo](https://sargadil.github.io/tabs/) or the
`e2e/fixtures/` pages:

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
