# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.3.1] — 2026-08-31

Maintenance release. No public API, behaviour, package exports, keyboard, or accessibility changes —
`1.3.1` is a drop-in replacement for `1.3.0`. The work was an internal maintainability pass
(the `MAINT` track).

### Changed
- Internal refactor of `src/js/`: the `Tabs` class now delegates to small internal helper modules
  under `src/js/internal/` (`config.js`, `keyboard.js`, `dom.js`, `error.js`). These are bundled
  into `dist/` and are not part of the public API. Library errors are unified behind a single
  `fail()` primitive; the exact `[@sargadil/tabs] …` messages are unchanged.
- Test suite reorganised into one file per behaviour area under `test/`, with shared fixture and
  setup helpers, plus isolated pure-unit tests for the keyboard and error modules. Coverage stays
  gated at 100% branch/function.
- Package smoke test now also compiles a real TypeScript consumer project against the packed
  tarball (`tsc --noEmit`); `typescript` added as a dev dependency (runtime dependencies remain 0).

### Documentation
- Finalised `docs/ARCHITECTURE.md` and `docs/COMPONENT_STANDARD.md` as stable references
  (the running refactor log was removed).
- Added `docs/MANUAL_ACCESSIBILITY_CHECKLIST.md`, a step-by-step manual screen-reader verification
  script, cross-linked from the accessibility docs.

## [1.3.0] — 2026-08-28

### Added
- `examples/` — a set of small, self-contained runnable pages (one use case each, public API only,
  no build step or framework): basic setup, manual activation, vertical, RTL, disabled tabs, custom
  navigation, `tabs:beforechange`, `tabs:change`, `refresh()`, and multiple instances. Served via
  `npm run examples` and smoke-tested in CI so the documented behaviour can't silently drift. See
  [`examples/`](examples/).
- `refresh()` — a public method to re-synchronize an instance with the current DOM after the
  consumer has added or removed `.tab-panel` elements (AJAX, a CMS, HTMX, a framework re-render)
  or toggled a tab's disabled state. It detects added/removed tabs and panels, moves event
  listeners off removed elements and onto new ones without ever double-binding (repeated
  `refresh()` calls never multiply event dispatches), re-synchronizes the ARIA relationships,
  panel ids, and disabled state, and preserves the active tab — falling back to the tab that took
  its position (or the new last tab) if the active panel was removed, skipping disabled tabs.
  Focus only moves if it was already inside the tablist; no `tabs:beforechange`/`tabs:change`
  event is dispatched. There is deliberately no `addTab()`/`removeTab()`/`updateTab()` and no
  `MutationObserver` — the DOM stays the consumer's responsibility. See
  [Dynamic tabs](README.md#dynamic-tabs).
- RTL support for horizontal tabs: `ArrowLeft`/`ArrowRight` now reverse (next/previous instead of
  previous/next) when the focused tab's direction, per the cascaded CSS `direction` property, is
  right-to-left. Direction is read from the DOM — via `dir="rtl"` on `<html>` or any closer
  ancestor — with no `options.rtl` flag to set. Vertical orientation (`ArrowUp`/`ArrowDown`),
  `Home`/`End`, and wrap-around are all unaffected by direction. See
  [RTL](README.md#rtl).
- Disabled tabs, following standard HTML/ARIA semantics with no library-specific attribute: the
  default nav renders a disabled panel's tab as a native `<button disabled>` (read from
  `aria-disabled="true"` on the panel's `.tab-panel__title`, since no tab element exists yet at
  generation time), and custom navigation (`options.useCustomNav: true`) reads whatever the author
  already marked — native `disabled` or `aria-disabled="true"`. A disabled tab does not activate
  on click, `Enter`, or `Space`, is skipped by arrow-key, `Home`/`End`, and swipe
  (`options.swipeable`) navigation (including wrap-around), and cannot be selected via `selectTab()` (throws
  `Cannot select disabled tab at index N.`). The constructor throws if `options.initSelectedItem`
  points at a disabled tab, or if every tab is disabled (`At least one enabled tab is required.`).
  See [Disabled tabs](README.md#disabled-tabs).
- A cancelable, bubbling `tabs:beforechange` CustomEvent
  (`{ fromIndex, toIndex, fromTab, toTab, fromPanel, toPanel }`), dispatched on the main
  container right before the selected tab changes — via click, keyboard, or `selectTab()`.
  Calling `preventDefault()` on it blocks the transition entirely: `aria-selected`, the roving
  `tabindex`, `hidden` panels, focus, and the selected index are all left exactly as they were,
  and `tabs:change` does not fire. See [`tabs:beforechange`](README.md#tabsbeforechange).
- A real-browser test suite (`npm run test:e2e`, [`e2e/`](e2e)) running on `@playwright/test`
  (dev dependency only) across Chromium, Firefox, and WebKit. Covers initialization, keyboard
  navigation in both orientations (including wrap-around and RTL), mouse click, manual activation mode,
  `options.swipeable`, `options.removeTabPanelTitle`, multiple instances on one page, and the
  public API (`selectTab()`/`getSelectedIndex()`/`destroy()`/`tabs:change`). Runs in CI on every
  push/PR.
- Automated accessibility scans (`@axe-core/playwright`, part of `npm run test:e2e`) covering
  default tabs, manual activation, vertical tabs, custom navigation, swipeable, and multiple tab
  groups on one page — scanned after initialization, after a click, after keyboard interaction,
  and after a swipe, including a dedicated dynamic-state check after repeated tab switching. Zero
  axe violations is not the same as full WCAG compliance; automated scans catch a subset of
  issues and don't replace manual screen reader testing.
- [`ACCESSIBILITY.md`](ACCESSIBILITY.md), documenting the actual ARIA structure, the keyboard
  contract for every orientation/activation-mode combination, what each automated test layer
  does and does not verify, known limitations, and a manual assistive-technology test matrix
  that only a human tester may mark `PASS`/`FAIL`.
- `npm run test:coverage`, gating unit tests on 100% branch and function coverage (Node's
  built-in `--experimental-test-coverage`, no added dependency). Runs in CI and as part of
  `prepublishOnly`, in place of `npm test`.
- A package smoke test (`npm run test:package`) that runs `npm pack`, installs the
  resulting tarball into a throwaway fixture project, and verifies the real publish
  artifact: `require()` (CJS), `import` (ESM), the `./style.css` export, the shipped
  TypeScript declarations, and the exact tarball file list. It runs in CI on every
  push/PR and again before `npm publish` (via `prepublishOnly`), so a broken
  `package.json`/`exports`/build wiring can no longer slip through as a working build
  with a broken publish artifact.
- Centralized configuration validation: the constructor now checks `contextID`,
  `options.orientation`, `options.activationMode`, `options.initSelectedItem`, and the required DOM
  structure (panels, per-panel titles, navigation, and custom nav/panel count matching) up front,
  throwing a descriptive `[@sargadil/tabs] ...` error naming the offending field instead of an
  unrelated low-level exception. See [Configuration validation](README.md#configuration-validation).

### Changed
- All errors thrown by the library are now consistently prefixed with `[@sargadil/tabs]` (previously
  `[tabs plugin]` in some cases).
- The package description and README intro no longer claim unconditional "Full
  Accessibility" / WCAG compliance; they now describe the component as following the
  WAI-ARIA Tabs Pattern.
- Inactive tab panels now get the native `hidden` attribute; the active panel never does.
  `hidden` is the semantic source of truth for panel visibility (set on initialization, on
  click, on automatic keyboard activation, and on `selectTab()`), so the component hides
  and shows panels correctly even without the bundled CSS. The `tab-panel--open` class is
  kept in sync purely as a styling hook and behaves exactly as before.
- README restructured into a conventional section order (What it is → Features → Installation
  → Basic usage → CSS → Configuration → API → Events → Accessibility → RTL → Disabled tabs
  → Dynamic tabs → Recipes → Browser support → Development → Migrating → License), with new
  Features, Browser support, and Development sections. No API or behavior changes.
- The live demo (`index.html`) gained RTL, disabled-tabs, and multiple-instances panels and a
  link to `examples/`.
- Contributor documentation added under `docs/` (`CONTRIBUTING.md`, `PROJECT.md`, `NON-GOALS.md`)
  plus `AGENTS.md` / `CLAUDE.md` for coding-agent onboarding. Not part of the published package.

### Fixed
- Generated nav buttons now have `type="button"`, and custom-nav `<button>` elements
  without an explicit `type` are given `type="button"` too, so tabs placed inside a
  `<form>` no longer trigger an accidental submit.
- README's configuration example showed `initSelectedItem: 1` while the actual default
  is `0`; the example now matches the code.

## [1.2.0] — 2026-08-26

### Changed
- Package renamed and republished as `@sargadil/tabs`. `tabs-a11y` is deprecated in favor
  of this package; no API or behavior changes — this is a straight identity migration.
  Build artifacts are now named `tabs.cjs`, `tabs.mjs`, `tabs.umd.js`, and `tabs.d.ts`
  (previously `tabs-a11y.*`). `dist/css/styles.min.css` is unchanged. See
  [Migrating from `tabs-a11y`](README.md#migrating-from-tabs-a11y) in the README.

## [1.1.1] — 2026-08-25

### Added
- Dark mode: the bundled CSS now respects `prefers-color-scheme: dark` automatically,
  using CSS custom properties (`--tabs-nav-bg`, `--tabs-surface-bg`, `--tabs-text-color`,
  etc.) scoped to `.tabs`, which consumers can also override to reskin the component.

### Changed
- `index.html` (the live demo) rebuilt from a single example into a documentation-style
  page with 7 live variants (default, vertical, manual activation, custom nav, custom
  titles, swipeable, responsive-in-a-narrow-container), each with a "Show code" panel,
  plus a dark/light theme toggle in the sticky nav.
- README's "Advance usage example" section (largely duplicated by the live demo above)
  trimmed to a short pointer at the demo, saving ~100 lines.

## [1.1.0] — 2026-08-25

The accessibility & DX overhaul. A large accessibility, developer-experience, and
tooling pass. No breaking changes — every addition below is backward compatible
with 1.0.2.

### Fixed
- `require('tabs-a11y')` / `import` crashed for every consumer — `package.json`'s `main`
  pointed at a file the build never produced.
- `Home`/`End` keys threw instead of jumping to the first/last tab.
- The newly selected tab got `tabIndex = 1` instead of `0`, corrupting the page's
  natural Tab order (roving tabindex requires `0`, not a positive value).
- A missing `.tab-panel` or `.tabs__nav` threw a generic `TypeError` instead of the
  intended `[tabs plugin] ...` error message.
- Clicking an already-active tab re-fired `tabs:change` and re-toggled its attributes
  instead of being a no-op.

### Added
- TypeScript declarations (`.d.ts`), shipped via `"types"` and the `exports` map.
- WAI-ARIA: `role="tabpanel"`, `aria-labelledby` linking each panel to its tab,
  automatic `role="tablist"` for custom nav, and a new `options.ariaLabel`.
- Public API: `destroy()`, `selectTab(index)`, `getSelectedIndex()`.
- A bubbling `tabs:change` CustomEvent (`{ index, tab, panel }`) on every real tab
  switch, for analytics or lazy-loading.
- `options.orientation: 'horizontal' | 'vertical'` (Up/Down arrow keys, `aria-orientation`)
  with a matching `.tabs--vertical` CSS layout.
- `options.activationMode: 'automatic' | 'manual'` — arrow keys move focus without
  selecting; the tab activates on click, Enter, or Space.
- `options.swipeable` — swipe left/right on a panel (touchscreens) to change tabs.
- Collision-safe panel/tab ids: multiple `Tabs` instances left at the default
  `tabPanelIdPrefix` on one page no longer produce duplicate ids.
- Responsive nav: it no longer wraps into multiple rows — it scrolls horizontally the
  moment it doesn't fit, reacting to whatever actually constrains its width (viewport
  or a narrower container), with a styled cross-browser scrollbar.
- `prefers-reduced-motion` is now respected for the panel open/close animation.
- `contextID` accepts an `HTMLElement` directly, not just a string id.
- A "Recipes" section in the README (React, Vue, URL hash sync, lazy-loading) built
  entirely from the public API above — no new code required.
- A test suite (`npm test`, Node's built-in test runner) and a GitHub Actions CI
  workflow running it on every push/PR.
- README badges (npm version, downloads, bundle size, license, CI) and ready-to-use
  unpkg/jsDelivr CDN snippets.

### Changed
- Build tooling migrated from Gulp to Vite (library mode) + the `sass` CLI. The
  package now ships ESM (`tabs-a11y.mjs`), CommonJS (`tabs-a11y.cjs`), and UMD
  (`tabs-a11y.umd.js`) builds instead of a single CJS-only bundle.
- Node upgraded to 24.19.0 (`.nvmrc`).
- `package.json` gained `main`/`module`/`types`/`unpkg`/`jsdelivr`/`exports`/`files`
  fields that actually point at what the build produces, and a `files` allowlist so
  the published npm tarball only contains `dist/`, `README.md`, and `LICENSE`.

## [1.0.2] and earlier

See the git history for changes prior to this changelog.
