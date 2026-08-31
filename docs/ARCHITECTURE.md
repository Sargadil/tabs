# Architecture — `@sargadil/tabs`

This document describes the library's structure and the constraints a change must
respect. It answers three questions:

- How is the library structured?
- Where are the responsibility boundaries?
- Which invariants must not be broken?

It is **not** public API documentation ([`README.md`](../README.md)), the
accessibility contract ([`ACCESSIBILITY.md`](../ACCESSIBILITY.md)), the
development rules ([`CONTRIBUTING.md`](./CONTRIBUTING.md)), or the roadmap
(maintenance work is tracked in `MAINT-N` tickets held by the maintainer). Where
a topic is owned by one of those files, the section here is a pointer, not a
copy — see [Related documents](#related-documents).

## Architectural goals

The library stays lightweight, framework-agnostic, dependency-free at runtime,
accessibility-first, predictable, testable, and maintainable.

When goals conflict, the project-wide priority order in
[`PROJECT.md`](./PROJECT.md#priority-order) decides
(`correctness → accessibility → tests → package quality → developer experience →
features → visual polish`). Architecture decisions follow the same order: a
cleaner internal structure never justifies a change to observable behavior.

## Public / private boundary

The public contract is only what is explicitly exported and documented. Not
public, and free to change without a major version:

- `src/js/internal/*` — internal helper modules;
- the internal file layout;
- private (`#`) fields and methods;
- generated internal IDs;
- any package path other than those in [Package contract](#package-contract).

Because of this boundary the internal architecture can be refactored without a
breaking change.

---

## Public contract

The **frozen baseline**, taken from `@sargadil/tabs@1.3.0`: a maintenance
refactor must not change anything here without an explicit maintainer decision
and a SemVer assessment.

Full usage examples are in [`README.md`](../README.md); the authoritative
keyboard and ARIA tables are in [`ACCESSIBILITY.md`](../ACCESSIBILITY.md). This
section records the contract itself — signatures, guarantees, package shape — not
how to use it.

### Constructor and configuration

```js
import Tabs from '@sargadil/tabs';   // default export in every format (ESM / CJS / UMD)

new Tabs(config?);
```

- `config` is optional. It is merged over the defaults by
  `internal/config.js` → `mergeConfig()`: objects recursively, arrays by
  concatenation, everything else by replacement.
- Constructor sequence: validate config → discover DOM → validate DOM structure →
  generate navigation (or adopt the author's) → assign panel IDs → wire
  listeners → activate `options.initSelectedItem`.
- Any invalid configuration or DOM throws a plain `Error` (not `TypeError`)
  prefixed `"[@sargadil/tabs] "`. There is no silent recovery.
- An instance exposes no public properties — only the methods below.

#### Options and defaults

```js
{
    contextID: 'tabs',                       // string (id) | HTMLElement
    classes: {
        tabsNavContainer: '.tabs__nav',
        tabsNavList:      '.tabs__nav-list',
        tabsNavButton:    '.tabs__nav-btn',
        tabPanel:         '.tab-panel',
        tabPanelTitle:    '.tab-panel__title',
    },
    selectors: {
        tabPanelIdPrefix: 'tabpanel',
        tabPanelOpen:     'tab-panel--open',
    },
    options: {
        useCustomNav:        false,
        customNavTitles:     [],
        initSelectedItem:    0,
        removeTabPanelTitle: false,
        ariaLabel:           '',
        orientation:         'horizontal',    // 'horizontal' | 'vertical'
        activationMode:      'automatic',     // 'automatic' | 'manual'
        swipeable:           false,
    },
}
```

Contract-relevant details (the full option reference is in `README.md`):

- `useCustomNav: true` — the library does not generate buttons; it adopts the
  existing `role="tab"` elements under `classes.tabsNavButton`.
- `customNavTitles` overrides labels by position; `data-nav-title` on a single
  `.tab-panel__title` overrides just that one.
- `orientation: 'vertical'` sets `aria-orientation="vertical"` and switches the
  arrow keys; it does not change layout (that is the `tabs--vertical` CSS class).
- `activationMode` — `'automatic'`: selection follows focus; `'manual'`: arrows
  only move focus.
- `swipeable` adds a touch swipe on panels (sets inline `touch-action: pan-y`);
  the threshold is 50 px and `|dx|` must exceed `|dy|`.

#### Validation rules

The rules and their exact messages are asserted by the tests and are part of the
contract; order is significant. Owned by `internal/config.js` —
`validateConfig()` for the config-only rules, `validateDomStructure()` for the
DOM-structure rules.

- `contextID` must be a string or an `HTMLElement`;
- the context element must exist in the DOM;
- `orientation` ∈ `{'horizontal', 'vertical'}`;
- `activationMode` ∈ `{'automatic', 'manual'}`;
- `initSelectedItem` must be an integer `>= 0`;
- at least one `.tab-panel` must exist;
- `initSelectedItem` must be `<` the panel count;
- default nav: a `.tabs__nav` container, and exactly one `.tab-panel__title` per
  panel;
- custom nav: at least one `role="tab"` element, and their count must equal the
  panel count;
- at least one tab must be enabled;
- `initSelectedItem` must not point at a disabled tab.

`refresh()` re-runs `validateDomStructure()` with the construction-only rules
(the `initSelectedItem` range check and the missing-title check) relaxed.

### Methods

| Method | Signature | Contract |
| --- | --- | --- |
| `selectTab(index)` | `(index: number) => void` | Programmatic selection. Throws `"[@sargadil/tabs] selectTab: no tab exists at index N."` if there is no such tab, `"[@sargadil/tabs] Cannot select disabled tab at index N."` if it is disabled. Selecting the current tab is a no-op. Fires `tabs:beforechange` / `tabs:change` like a click. |
| `getSelectedIndex()` | `() => number` | Index of the tab with `aria-selected="true"`, or `-1` if none. |
| `refresh()` | `() => void` | Re-synchronize with the current DOM. Re-validates the structure (same prefixed `Error` as the constructor), moves listeners off removed elements onto new ones without double-binding, re-syncs the ARIA relationships, panel IDs, and disabled state. Keeps the active tab if its panel still exists; otherwise activates the tab now at that position (or the new last tab), skipping disabled tabs. Moves focus only if it was already inside the tablist. Dispatches no events. |
| `destroy()` | `() => void` | Removes every listener the instance added (`keydown` / `click` on tab buttons, `touchstart` / `touchend` on panels). Does not restore the generated markup or ARIA attributes. |

### Events

Both are `CustomEvent`s dispatched on the context element, `bubbles: true`.

| Event | `cancelable` | `detail` |
| --- | --- | --- |
| `tabs:beforechange` | `true` | `{ fromIndex, toIndex, fromTab, toTab, fromPanel, toPanel }` |
| `tabs:change` | `false` | `{ index, tab, panel }` |

- `tabs:beforechange` fires before any state change. `preventDefault()` aborts
  the transition — `aria-selected`, the roving `tabindex`, `hidden`, focus, and
  the selected index are all left unchanged — and `tabs:change` does not fire.
- Both fire on pointer, keyboard (automatic: always; manual: on activation),
  swipe, and `selectTab()`.
- `refresh()` fires neither.
- An interaction aimed at a disabled tab fires neither (the disabled check runs
  first).
- Re-selecting the current tab (`old === new`) fires neither.

### Package contract

`package.json` (`@sargadil/tabs@1.3.0`) — the supported paths:

| Field / export | Path | Format |
| --- | --- | --- |
| `main` | `./dist/js/tabs.cjs` | CommonJS |
| `module` | `./dist/js/tabs.mjs` | ESM |
| `types` | `./dist/js/tabs.d.ts` | TypeScript declarations |
| `unpkg`, `jsdelivr` | `./dist/js/tabs.umd.js` | UMD (global name `Tabs`) |
| `exports["."]` | `types` → `.d.ts`, `import` → `.mjs`, `require` → `.cjs`, `default` → `.mjs` | — |
| `exports["./style.css"]` | `./dist/css/styles.min.css` | CSS |
| `exports["./package.json"]` | `./package.json` | — |

- The default export in every module format is the `Tabs` class.
- Published tarball contents (`files` plus what npm always adds): `dist/`,
  `README.md`, `LICENSE`, `CHANGELOG.md`, `package.json`. The list is frozen by
  `scripts/package-smoke/` (`EXPECTED_TARBALL_FILES`).
- CSS is a presentation layer; the component works without it (`hidden` is the
  source of truth for panel visibility).
- Runtime dependencies: `0`.

#### TypeScript surface

`dist/js/tabs.d.ts` is hand-maintained as `src/js/script.d.ts` and copied into
`dist/` by the build. The package smoke test compiles a real consumer project
(`scripts/package-smoke/consumer-ts/`) against the packed tarball with
`tsc --noEmit`, so the shipped declarations are checked the way an npm consumer
sees them — including snippets that must stay type errors.

- `export default class Tabs` with `constructor(configs?: TabsConfig)`,
  `destroy(): void`, `getSelectedIndex(): number`,
  `selectTab(index: number): void`, `refresh(): void`.
- Named exports: `TabsClasses`, `TabsSelectors`, `TabsOptions`, `TabsConfig`,
  `TabsChangeEventDetail`, `TabsChangeEvent`, `TabsBeforeChangeEventDetail`,
  `TabsBeforeChangeEvent`.
- `HTMLElementEventMap` augmentation for `'tabs:change'` and `'tabs:beforechange'`.
- `orientation` and `activationMode` are union types, not `string`.

### DOM the component owns

A refactor may change *how* these are produced, but not the *result*:

- panels: `id`, `role="tabpanel"`, `tabindex="0"`, `aria-labelledby`, `hidden`,
  the `tab-panel--open` class (on the visible one);
- default nav: `<div role="tablist">` containing
  `<button type="button" role="tab" aria-selected aria-controls [disabled]>` per
  tab; the tab `id` is `${panelId}-tab`;
- custom nav: `role="tablist"` on the list, and on each tab `aria-controls`,
  `aria-selected`, an `id` (if missing), and `type="button"` (if it is a
  `<button>` without a `type`);
- a panel with no `id` of its own gets `${selectors.tabPanelIdPrefix}-${index}`,
  de-duplicated against the whole document.

### Behavioral invariants

The behavioral contract is the [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
as implemented here. The authoritative, testable tables — activation modes,
horizontal / vertical, RTL, disabled tabs, `Home`/`End`, wrapping, focus
movement — live in [`ACCESSIBILITY.md`](../ACCESSIBILITY.md). A refactor must
keep every row of those tables true.

The short list of things that break silently (the normative version is
[`AGENTS.md` → Accessibility invariants](../AGENTS.md#accessibility-invariants)):

- exactly one tab has `aria-selected="true"`;
- exactly one tab is focusable (`tabindex="0"`), the rest `tabindex="-1"`;
- `aria-controls` / `aria-labelledby` stay correct across `refresh()`;
- inactive panels carry `hidden`, updated synchronously with `aria-selected`;
- generated IDs stay unique across multiple instances on one page;
- `refresh()` on one instance does not touch another.

---

## State model

The component distinguishes four things that are not always the same element:

| Concept | DOM representation |
| --- | --- |
| selected tab | `aria-selected="true"` + roving `tabindex="0"` + its panel visible |
| focused tab | `document.activeElement`; in `activationMode: 'manual'` it can differ from the selected tab while arrows move focus |
| disabled tab | native `disabled` or `aria-disabled="true"` (never a library-specific attribute) |
| visible panel | the one panel **without** `hidden` |

State is not duplicated beyond this — there is no `data-state` mirror (see
[`NON-GOALS.md`](./NON-GOALS.md)). The `tab-panel--open` class tracks the visible
panel purely as a styling hook and is never the source of truth.

### Naming (internal)

The source keeps one word per concept, so *selected* and *focused* never blur:

| Term | Meaning in the code |
| --- | --- |
| **selected** | the tab with `aria-selected="true"` and its visible panel — `getSelectedIndex()`, `#setSelectedTab()`, `#resolveSelectedIndex()`, `dom.markSelected()` |
| **focused** | `document.activeElement` / the roving `tabindex="0"` target; only equals the selected tab outside `activationMode: 'manual'` mid-navigation — `dom.moveRovingFocus()`, `keyboard` `currentIndex` |
| **tab button** | a resolved `role="tab"` element — `#elements.tabButtons`, `dom.queryTabButtons()`. Distinct from `classes.tabsNavButton`, the *config selector* for an author-supplied custom-nav element |
| **active** | reserved for the platform's own `document.activeElement` — never used as a synonym for *selected* |

The user-facing docs (`README.md`, `ACCESSIBILITY.md`) call the selected tab the
"active tab"; that is the same thing as *selected* here.

Convention: `snake_case` for locals and function parameters, `camelCase` for
object / spec properties and configuration keys.

---

## Responsibility boundaries

The implementation is one orchestrator class plus four internal helper modules.
The split is by responsibility and goes no finer than readability requires.

| Layer | File | Owns | Does not touch |
| --- | --- | --- | --- |
| **Orchestration** | `src/js/script.js` — the `Tabs` class | initialization, the selection transition, `refresh()` reconciliation, event dispatch, lifecycle — *what should happen, and in what order* | low-level DOM writes, key interpretation, the wording of validation errors |
| **Configuration** | `src/js/internal/config.js` | option defaults, the deep config merge, every config- and DOM-structure validation rule together with its exact `[@sargadil/tabs] …` message | reading or mutating the DOM, selection, keyboard, events |
| **Keyboard** | `src/js/internal/keyboard.js` | pure key / swipe → target-index decisions: orientation, RTL direction, wrap-around, skipping disabled tabs | the DOM, a `Tabs` instance, `activationMode` |
| **DOM / ARIA** | `src/js/internal/dom.js` | element discovery, unique id generation, nav markup, and every `aria-*` / `tabindex` / `hidden` / focus write — *how a resolved state is represented in the DOM* | deciding which tab is selected |
| **Error** | `src/js/internal/error.js` | the one throw primitive — `ERROR_PREFIX` + `fail(message)`, always a plain prefixed `Error` (never `TypeError`, never a raw low-level exception) | anything else |

The keyboard and DOM layers never decide selection. Keyboard returns an index;
the orchestrator applies it as a selection or a focus move depending on
`activationMode`; the DOM layer is handed the resolved index, labels, and
disabled flags and writes them out.

### Orchestrator ↔ helper contract

The helpers are pure functions or DOM leaves. The orchestrator is the only
stateful piece and the sole holder of instance state:

| Private field | Holds |
| --- | --- |
| `#context` | the resolved context element. Every document access goes through `#context.ownerDocument`; the one exception is the bootstrap `document.getElementById()` in `#initElements()`, which runs before `#context` exists |
| `#elements` | the queried `NodeList`s keyed by the config `classes` names, plus the resolved `tabButtons` (`role="tab"` list). Re-read from the live DOM on construction and on every `refresh()` |
| `#configs` | the effective configuration — defaults deep-merged with the caller's object |
| `#panelIds` | the resolved, collision-free panel ids |
| `#navTitleByPanel` | a `WeakMap` label cache, so a `refresh()` after `options.removeTabPanelTitle` (which deletes the source `.tab-panel__title`) can still regenerate a tab's label |

`config.validateDomStructure()` does not read the DOM: the orchestrator runs
discovery, then passes it element counts plus an `isSourceDisabled(index)` probe,
so the rules stay unit-testable in isolation. The two construction-only checks
(the `initSelectedItem` range check and the missing-title check) are relaxed on
`refresh()` via an `isRefresh` flag.

The nav label priority — `options.customNavTitles` → the panel's
`.tab-panel__title` (`data-nav-title` or its text) → the `#navTitleByPanel` cache
→ `""` — lives in the orchestrator (`#getNavTitle`); `dom.js` only performs the
leaf element read (`titleText`). The priority and the cache are instance
concerns, so that split is deliberate.

### Disabled state — two readers, by design

Disabled is read from two different sources at two different times, so there are
two predicates in `dom.js`:

- `isSourceDisabled(source, index)` — the **as-authored** DOM, consulted during
  validation and `refresh()` reconciliation, before the default nav exists (the
  custom-nav tab element, or `aria-disabled` on `.tab-panel__title`);
- `isTabDisabled(tab)` — the **rendered** tab button (native `disabled` or
  `aria-disabled="true"`), consulted by click / keyboard / swipe handlers and
  `selectTab()`.

The keyboard layer never calls either — the orchestrator hands it a pre-computed
`enabled` boolean array.

### Deliberately not separate modules

- **selection** and **events** — the transition (`#setSelectedTab`) and the two
  `CustomEvent`s are short, tightly interwoven, and the event payload is public
  contract; they stay in the orchestrator.
- **swipe** — the touch plumbing stays in the orchestrator; the "which tab"
  decision is `keyboard.adjacentEnabledIndex()`, shared with the arrow keys.
- **utilities** — distributed to their owners. Only the error primitive is shared
  widely enough to stand alone as a module.

### One resolved-elements object, not passed around

The orchestrator threads individual `#elements` entries into each `dom.*` call
rather than passing one "resolved elements" value object. This is a deliberate
stop: the current shape is readable and every `dom.*` signature stays explicit
about exactly what it needs.

---

## Flows

### Initialization

```text
new Tabs(config)
↓
mergeConfig(config)                 internal/config.js
↓
validateConfig()                    internal/config.js — throws on bad config
↓
#initElements()                     resolve context + dom.discoverElements()
↓
#validateDomStructure()             internal/config.js — throws on bad structure
↓
#generatePanelIds()                 dom.ensurePanelIds() — assign / keep unique ids
↓
#initTabs(initSelectedItem)         nav markup + roving tabindex + wire listeners + dom.syncPanels
                                    + (swipeable) #initSwipe + (removeTabPanelTitle) dom.removeAll
```

### Selection

```text
request selection (click / key / swipe / selectTab)
↓
disabled target? ── yes → ignore (no event)
↓ no
old === new? ── yes → no-op (no event)
↓ no
tabs:beforechange (cancelable)
↓
cancelled? ── yes → restore focus if the browser moved it inside the tablist; stop
↓ no
write aria-selected + roving tabindex, move focus
↓
toggle panel hidden + open-class
↓
tabs:change
```

### Refresh

```text
consumer mutates the tabs / panels DOM
↓
refresh()
↓
snapshot previous selection + whether focus was in the tablist
↓
#initElements() + #validateDomStructure(isRefresh = true)   throws while still wired to old elements
↓
tear down listeners on the previous elements
↓
regenerate panel ids, rebuild / adopt nav (remove-before-add wiring)
↓
#resolveSelectedIndex(): keep selected panel → else positional fallback → else skip disabled
↓
re-sync ARIA, hidden, disabled state
↓
restore focus to the selected tab only if it was in the tablist before
```

No `MutationObserver`; `refresh()` is the only reconciliation entry point (see
[`NON-GOALS.md`](./NON-GOALS.md)).

### Lifecycle

```text
construct → initialize → interact → (optional refresh) → destroy
```

`destroy()` removes library-owned listeners only. It does not undo the generated
markup or ARIA — a destroyed instance leaves the DOM in its last rendered state.

---

## Testing layers

Which layer a test belongs to is a boundary decision, and this section is the
rule that settles it. The commands and the "which suite for which change" table
are in [`AGENTS.md` → How to verify](../AGENTS.md#how-to-verify); the exhaustive
per-behavior inventory is in
[`ACCESSIBILITY.md` → Automated testing](../ACCESSIBILITY.md#automated-testing).

| Layer | Responsible for | Not responsible for |
| --- | --- | --- |
| pure unit (`test/*.test.mjs`, no jsdom) | pure internal modules in isolation — the keyboard / swipe decision function (`keyboard.test.mjs`: key + orientation + RTL + position + `enabled` array → target index) and the shared error primitive (`error.test.mjs`: plain prefixed `Error`) | anything DOM-, focus-, or event-related |
| unit / integration (`test/*.test.js`, jsdom) | config validation and its message text, state transitions, `aria-*` / `hidden` / roving `tabindex` wiring, event `detail` shape and order, `refresh()` reconciliation, `selectTab()` / `getSelectedIndex()` / `destroy()`, multiple-instance isolation | real focus, real computed styles / layout, real hit-testing, the browser accessibility tree, cross-browser differences |
| package smoke (`scripts/package-smoke/`) | the real `npm pack` tarball — `exports`, ESM/CJS, CSS, `.d.ts` shape, file list, plus a real `tsc --noEmit` compile of a consumer project (`consumer-ts/`) against the installed tarball | anything about component behavior |
| Playwright (`e2e/`) | real focus movement, real key events over the rendered nav, the accessibility tree (`getByRole` seeing exactly one `tabpanel`), `Enter` / `Space` activation, cascaded `direction` resolution, touch / swipe, the mousedown-focuses-target quirk, that the shipped bundle behaves the same in Chromium / Firefox / WebKit | logic a unit test already pins down cheaply — validation branches, message text, payload keys |
| axe (`e2e/accessibility.spec.js`) | automated ARIA / contrast / naming regression detection, on initial render and after interaction | whether the component is actually usable with a screen reader |
| manual AT | VoiceOver / NVDA / other assistive technology | — never marked PASS by automation |

### Unit vs. browser — the split

Put a test in the **unit** layer when the thing under test is a decision or a
state change: a validation rule, an error message, which index the keyboard
picks, what `aria-selected` / `hidden` / `tabindex` end up as, the `detail` of an
event, the order two events fire in, what `refresh()` does to a mutated DOM.
jsdom is enough for all of it and the suite runs in about a second.

Put a test in the **browser** layer when the thing under test only exists in a
real engine: where focus actually lands, whether a real `ArrowRight` keypress
travels through the rendered nav, what `getByRole` (the accessibility tree) sees,
`Enter` / `Space` activating a `<button>`, cascaded `direction` resolution, touch
gestures, and the fact that the built bundle loads and runs the same way in three
browsers.

### Deliberate parallel coverage

Some behavior is checked at more than one layer **on purpose** — this is not
duplication to remove:

- **Keyboard navigation** (arrows, `Home` / `End`, wrap-around, disabled-skipping,
  RTL). `keyboard.test.mjs` pins the pure algorithm with plain values; the jsdom
  suites check that the orchestrator reads `dir` and disabled state *from the DOM*
  and routes the result to selection vs. focus per `activationMode`; the
  Playwright specs check that a real keypress produces real focus movement and
  selection in every engine. Each layer covers a different link in the chain.
- **`tabs:beforechange` cancellation.** The jsdom suite pins the payload and the
  "nothing mutated, `tabs:change` suppressed" contract;
  `e2e/before-change.spec.js` additionally proves a real browser's
  mousedown-focus is unwound on a canceled click, which jsdom cannot reproduce.
- **Disabled-tab guards.** Unit tests prove the component's own guard;
  the Playwright specs additionally prove a native `<button disabled>` or an
  `aria-disabled` element stays inert against a real event path.

What is *not* wanted is a third test that re-asserts the same plain value with no
new dimension — re-checking an error string, or an event `detail` key, in a
browser when a unit test already owns it. A new test goes to the lowest layer
that can actually exercise its risk.

Coverage is gated at 100% branch and 100% function on the built bundle; that gate
does not move.

---

## Constraints

### Dependency policy

Runtime dependencies: `0`. A runtime dependency needs a separate, explicit
maintainer decision; dev dependencies for build / tests / tooling are fine. The
rationale is in
[`CONTRIBUTING.md`](./CONTRIBUTING.md#runtime-dependencies) and
[`NON-GOALS.md`](./NON-GOALS.md).

### Generated artifacts

`dist/` is committed but generated. Never hand-edit it — change `src/`, then
`npm run build` (also run by `prepublishOnly`). Source → build → package. Details
in [`AGENTS.md` → Generated files](../AGENTS.md#generated-files).

### Architectural non-goals

The core must not grow into a UI framework, an animation framework, a gesture
library, a framework-specific component library, or a DOM-observer framework. New
capability requires a real, demonstrated user problem. The feature-level list —
`data-state`, `addTab()` / `removeTab()`, `MutationObserver`, framework wrappers,
type-ahead, an expanded gesture system — is in [`NON-GOALS.md`](./NON-GOALS.md).

### Refactoring rule

The internal structure may change; the public contract may not, during a
maintenance refactor. Before a larger refactor:

```text
tests define behavior
architecture (this document) defines constraints
public documentation (README / ACCESSIBILITY) defines the contract
```

After the refactor all three must still agree.

---

## Related documents

| Topic | Canonical source |
| --- | --- |
| Install and use the API | [`README.md`](../README.md) |
| Keyboard / ARIA / focus contract, manual AT matrix | [`ACCESSIBILITY.md`](../ACCESSIBILITY.md) |
| Development rules, quality gates, per-ticket workflow, agent prompts | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Why the project exists, priority order, namespace | [`PROJECT.md`](./PROJECT.md) |
| Features intentionally out of scope | [`NON-GOALS.md`](./NON-GOALS.md) |
| Agent entry point, repo map, verify commands, invariants (short form) | [`AGENTS.md`](../AGENTS.md) |
| Reusable standard for future `@sargadil/*` components | [`COMPONENT_STANDARD.md`](./COMPONENT_STANDARD.md) |
| User-facing change history | [`CHANGELOG.md`](../CHANGELOG.md) |
