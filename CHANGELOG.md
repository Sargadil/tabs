# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
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
