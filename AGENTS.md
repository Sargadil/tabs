# AGENTS.md

Entry point for coding agents working in this repository. It points at the
authoritative docs and states the constraints that are easy to break — it does
not restate the API or the accessibility contract (those live in `README.md` and
`ACCESSIBILITY.md` and would go stale here).

## What this project is

`@sargadil/tabs` is a lightweight, framework-agnostic, accessibility-first,
zero-runtime-dependency tabs library implementing the
[WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). The
implementation is the `Tabs` class in `src/js/script.js`, with a small number of
internal, non-public helper modules under `src/js/internal/` (`config.js`,
`keyboard.js`, `dom.js`, `error.js`). Everything builds into a single bundle per
format.

The goal is a small, predictable, well-tested library — not a feature-rich one.
`docs/PROJECT.md` has the full context and the priority order that settles
conflicts (correctness first, visual polish last).

## Read before changing code

Public docs (present in every clone):

| File | Role |
| --- | --- |
| `README.md` | Public package usage and API |
| `docs/PROJECT.md` | What the project is and why; priority order; AI workflow |
| `docs/CONTRIBUTING.md` | Development and quality rules, per-ticket gates, reusable agent prompts |
| `docs/ARCHITECTURE.md` | Structure, responsibility boundaries, invariants, the frozen public contract |
| `docs/NON-GOALS.md` | Features intentionally out of scope — do not implement them |
| `ACCESSIBILITY.md` | Accessibility and keyboard contract |
| `CHANGELOG.md` | User-facing change history (`[Unreleased]` at the top) |

Planned work is delivered as numbered `ROADMAP-N` tickets; the maintainer gives
you the ticket to implement. Implement only that ticket.

## Repository map

```
src/js/script.js         The Tabs class — orchestration + DOM/ARIA/keyboard (private #methods)
src/js/internal/         Internal, non-public helper modules (config.js, keyboard.js, dom.js, error.js); bundled into dist/
src/js/script.d.ts       Public TypeScript types — hand-maintained, copied into dist/ by the build
src/scss/                Style source
dist/                    Generated build output — COMMITTED (see "Generated files")
test/*.test.js           Unit/integration tests (node --test, jsdom), one file per behavior area
test/keyboard.test.mjs   Isolated unit tests for src/js/internal/keyboard.js (pure, no jsdom)
test/helpers/setup.js    Shared setup() boot + click/keydown/touch event helpers
test/helpers/fixtures.js HTML fixture builders (tabsHtml/customNavHtml/panels) + customNavConfig()
e2e/                     Playwright: specs, fixtures/, axe scans, static server
examples/                Small runnable public-API examples (also smoke-tested in CI)
index.html               Live demo (served at github.io via Pages-from-branch)
scripts/package-smoke/   Packs the tarball and verifies it in a throwaway fixture project (incl. a tsc consumer compile in consumer-ts/)
.github/workflows/       CI (ci.yml) and release (publish.yml)
```

Three separate sets of tabs markup exist — don't confuse them:

- `examples/` — canonical, documentation-grade cases; some double as Playwright fixtures.
- `e2e/fixtures/` — test pages for combinations that aren't good documentation (RTL variants, swipe, …).
- `index.html` — the presentational demo.

## Public API

Small on purpose. The full surface:

```
new Tabs(config)            constructor; validates config + DOM, throws "[@sargadil/tabs] …" on error
destroy()                   remove all listeners added by the instance
selectTab(index)            programmatic selection
getSelectedIndex()
refresh()                   re-sync with the current DOM after the consumer mutates it
event "tabs:beforechange"   bubbling, cancelable (preventDefault() blocks the switch)
event "tabs:change"         bubbling
options.orientation         "horizontal" | "vertical"
options.activationMode      "automatic" | "manual"
```

Details are in `README.md` and `src/js/script.d.ts`; the frozen contract
(guarantees, package shape, error messages) is `docs/ARCHITECTURE.md` →
*Public contract*. Read those — don't rely on this list for anything beyond
orientation.

## Architecture invariants

Do not break these without an explicit, justified decision:

- runtime dependencies = 0
- the core stays framework-agnostic — no React/Vue/Angular/Svelte code in `src/`
- native HTML first; ARIA only where native semantics fall short; custom behavior last
- accessibility state must not depend on CSS alone — panel visibility is the
  native `hidden` attribute, not a class
- don't duplicate state without a concrete reason (no `data-state` when
  `aria-selected` + `hidden` already express it)
- the public API stays small
- backward compatibility is preserved unless a breaking change is explicit and documented
- don't build anything listed in `docs/NON-GOALS.md` without an explicit maintainer decision

## Accessibility invariants

Before touching keyboard handling, focus, ARIA attributes, panel visibility, or
tab selection, read `ACCESSIBILITY.md`. The contract in short (the exact keyboard
tables are in that file):

- roles: `tablist` / `tab` / `tabpanel`
- `aria-selected`, `aria-controls`, `aria-labelledby` kept in sync
- roving `tabindex` (one `0`, the rest `-1`)
- inactive panels carry `hidden`
- text direction (RTL) is detected from the DOM, not a config flag

## How to verify

Commands are defined in `package.json`; CI runs them in
`.github/workflows/ci.yml`. Node version is in `.nvmrc`.

```
npm ci
npm run build           vite build + copy script.d.ts into dist/ + sass
npm test                node --test
npm run test:coverage   same, gated at 100% branch + 100% function — do not lower the threshold
npm run test:package    npm pack, install the tarball into a fixture, check CJS/ESM/CSS/types + tsc consumer compile
npm run test:e2e        Playwright on Chromium/Firefox/WebKit, incl. @axe-core/playwright
npm run examples        static server for examples/ (http://127.0.0.1:4173/examples/<file>)
npm pack                inspect tarball contents
```

Match the check to the change:

| Change | Run |
| --- | --- |
| source behavior | `npm run test:coverage`, plus new tests for the new behavior |
| `package.json` / `exports` / build output | `npm run test:package` + `npm pack` |
| keyboard / focus / DOM / browser events | `npm run test:e2e` |
| accessibility | `npm run test:e2e` (Playwright + axe) |
| screen reader / assistive technology | human only — see below |

## Generated files

`dist/` is committed but generated. Do not hand-edit anything under `dist/`.
Change `src/`, then run `npm run build`. The build also runs in
`prepublishOnly`.

## Change discipline

- implement only the requested scope; no drive-by features, no large refactor riding along with a small fix
- no new dependencies without a strong reason
- update tests together with any behavior change
- update `src/js/script.d.ts` together with any public API change
- update `README.md` when public behavior changes
- add a `CHANGELOG.md` `[Unreleased]` entry for any user-facing change

## What an agent must not finish on its own

A human must do these — an agent may not mark them done:

- VoiceOver / NVDA / other manual screen-reader verification. Never report `PASS`
  on the strength of automated tests alone; leave it as `TBD`.
- final release approval
- `npm publish` and the GitHub Release

## AI role

> AI executes. Maintainer decides.

Propose solutions, implement, write tests, analyze edge cases. Do not expand the
public API or add features just because they are cheap to generate.
