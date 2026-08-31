# Reusable component standard — `@sargadil/*`

The baseline quality standard for the next interactive component published under
`@sargadil/*`. It was extracted from `@sargadil/tabs` after that package
stabilized; Tabs is the worked example throughout, not the template.

This document is **not** Tabs-specific. What carries over to another component is
the standard — repository shape, quality gates, testing philosophy, release
discipline, documentation structure. What does **not** carry over is the Tabs
API, its state model, its keyboard map, or its WAI-ARIA pattern: every component
designs those from its own problem.

It is also not a substitute for a component's own docs. Each package still writes
its own `README.md`, `ARCHITECTURE.md`, `ACCESSIBILITY.md`, and `CONTRIBUTING.md`
— this file says what those must cover, not what they must say.

Not every `@sargadil/*` package is a UI component. This standard applies to
interactive DOM libraries similar to `@sargadil/tabs`, `@sargadil/accordion`,
`@sargadil/dialog`. A non-UI package takes the parts that still make sense
(namespace, dependency policy, package tests, CI, release gate) and ignores the
rest.

---

## How to read this document

Every requirement is one of two tiers:

- **Baseline** — every interactive component under `@sargadil/*` does this, no
  exceptions.
- **When applicable** — required only when the stated trigger is true. The
  trigger is named in the section. If it does not apply, the requirement does
  not.

The distinction matters because a small first release should not be forced to
carry a reference-grade documentation set or a three-browser matrix on day one —
but it must never skip the baseline.

| Area | Tier | "When applicable" trigger |
| --- | --- | --- |
| Problem statement and scope | Baseline | — |
| Namespace and package name | Baseline | — |
| Zero runtime dependencies | Baseline | — |
| Repository and source structure | Baseline | — |
| Public / private boundary | Baseline | — |
| Minimal public API | Baseline | — |
| Native-platform-first | Baseline | — |
| Framework independence | Baseline | — |
| State model documented | Baseline | component holds interactive state |
| Package exports (ESM / CJS / UMD / CSS) | When applicable | per module format / asset actually shipped |
| TypeScript declarations + consumer compile test | When applicable | package ships `.d.ts` |
| Unit tests organized by behavior | Baseline | — |
| Package smoke test (`npm pack`) | Baseline | package is published to npm |
| Browser tests | When applicable | behavior depends on real focus / keyboard / DOM / browser events |
| Browser matrix (Chromium / Firefox / WebKit) | When applicable | component is a stable, published UI package |
| Accessibility contract | When applicable | component renders interactive UI |
| WAI-ARIA APG conformance | When applicable | a matching APG pattern exists |
| Keyboard / focus contract documented | When applicable | component has keyboard behavior |
| axe automation | When applicable | component renders UI |
| Manual assistive-technology matrix | When applicable | component has significant keyboard / focus behavior |
| Runnable examples | Baseline | — |
| Reference documentation set | When applicable | package is promoted as a reference |
| `AGENTS.md` onboarding | Baseline | — |
| CI gate before merge | Baseline | — |
| Release gate and SemVer | Baseline | — |
| Definition of Done | Baseline | — |

---

## 1. Problem statement and scope — Baseline

A component exists only when it solves a concrete problem that the platform and
the existing `@sargadil/*` set do not already solve.

Before the first line of code, write down:

- the problem, in one paragraph;
- who has it;
- why native HTML / CSS is not enough on its own;
- what is explicitly out of scope.

The out-of-scope list becomes the package's `NON-GOALS.md`. Prefer *small,
focused, predictable, standards-based, framework-agnostic* over feature count.

## 2. Namespace and package name — Baseline

Packages are `@sargadil/<name>`. `@sargadil` is the maintainer's
general-purpose namespace; it does not by itself imply a UI or accessibility
package — the category comes from the package's own name, docs, and purpose.

The `<name>` is the problem, not the mechanism: `tabs`, not `tab-controller`.

## 3. Zero runtime dependencies — Baseline

Default and expectation:

```text
runtime dependencies = 0
```

A runtime dependency is added only after an explicit maintainer decision, and
only when all of these hold: it solves a significant problem, a local
implementation is not worthwhile, and its maintenance and supply-chain cost is
lower than its benefit. Saving a few lines is not a reason.

Dev dependencies for build, test, lint, and tooling are unrestricted.

## 4. Repository and source structure — Baseline

Preferred source baseline:

```text
src/
├── js/
│   ├── <component>.js        orchestrator / public class
│   ├── <component>.d.ts      hand-maintained public types (if shipped)
│   └── internal/             non-public helpers, bundled into dist/
│       ├── config.js         defaults, normalization, validation + messages
│       ├── keyboard.js       pure input → intent decisions (if interactive)
│       ├── dom.js            DOM / ARIA writes
│       └── error.js          the single throw primitive
└── scss/                     style source (if the component ships CSS)
```

This is a starting point, not a rigid layout. Create an internal module only
where there is a real responsibility boundary. Avoid both extremes — one
3000-line file, and thirty 10-line files. `@sargadil/tabs` landed on one
orchestrator plus four internal modules; a simpler component may need only
`config.js`.

`dist/` is generated. If it is committed, it is never hand-edited: change
`src/`, run the build, and let `prepublishOnly` rebuild before publish.

## 5. Public / private boundary — Baseline

Public API is **only**: documented exports, documented methods, documented
options, documented events. Everything else — `internal/*`, the file layout,
private (`#`) fields, generated IDs, any package path not in the export map — is
free to change without a major version.

State this boundary explicitly in the component's `ARCHITECTURE.md` so a
refactor is never mistaken for a breaking change.

## 6. Minimal public API — Baseline

Every public element is a permanent maintenance commitment. Before adding one,
answer:

- Why does this have to be public?
- Can the existing API already produce this result?
- Will it still be supportable across the next major version?

If there is no clear answer, it does not go in. A low implementation cost is
never an argument for a larger surface.

## 7. Native-platform-first — Baseline

Order of preference:

```text
native HTML  →  platform APIs  →  ARIA  →  custom behavior
```

ARIA does not replace a native element or state without a reason. Component
state that a native attribute already expresses (`hidden`, `disabled`,
`open`, …) is read from that attribute, not mirrored into a second one.

## 8. Framework independence — Baseline

The core stays framework-agnostic: no React / Vue / Angular / Svelte code in
`src/`. A framework wrapper, if there is ever demand, is a separate package —
never a dependency or a code path in the core.

## 9. State model — Baseline (when the component holds interactive state)

Document, in `ARCHITECTURE.md`:

- the states the component distinguishes;
- the transitions between them;
- how each state is represented in the DOM;
- how focus is represented, and where it can legitimately diverge from selection.

Do not duplicate state without a concrete need. Each additional source of truth
is a resync risk.

## 10. Package exports — When applicable

Applies per module format and per asset the package actually ships. For each one
shipped, the `package.json` `exports` map and the legacy fields
(`main` / `module` / `types` / `unpkg`) must be consistent and covered by the
package smoke test.

Typical full shape (Tabs):

| Format | Field | File |
| --- | --- | --- |
| ESM | `module`, `exports.import` | `dist/js/<name>.mjs` |
| CommonJS | `main`, `exports.require` | `dist/js/<name>.cjs` |
| UMD | `unpkg`, `jsdelivr` | `dist/js/<name>.umd.js` |
| Types | `types`, `exports.types` | `dist/js/<name>.d.ts` |
| CSS | `exports["./style.css"]` | `dist/css/*.min.css` |

A component that ships only ESM ships only the ESM rows — but whatever it ships,
it ships coherently.

## 11. TypeScript — When applicable (package ships `.d.ts`)

If declarations are shipped:

- the full public API is described — no gaps;
- constrained options are union types (`'automatic' | 'manual'`), never `string`;
- the declarations match the runtime, both directions;
- a **real consumer project** compiles against the *packed tarball* (not `src/`)
  with `tsc --noEmit`, including snippets annotated `// @ts-expect-error` that
  must stay errors.

Checking that a `.d.ts` is present in the tarball is not sufficient.

## 12. Unit tests — Baseline

Test observable behavior, not private implementation. Organize test files by
behavior area — `initialization`, `configuration`, `interaction`, `events`,
`lifecycle`, … — not by private method name.

Cover: the public API, state transitions, edge cases, configuration errors and
their exact message text, event payload shape and order. Pure internal modules
(a keyboard decision function, an error primitive) get their own isolated tests
with plain values and no DOM.

Shared fixtures live in one `test/helpers/` location and stay explicit at the
call site — a fixture must not hide the part of the setup the test is about.
Coverage threshold, once set, does not move down.

## 13. Package smoke test — Baseline (published packages)

Every published package tests the **real tarball**:

```text
npm pack  →  install the tarball into a throwaway project  →  assert the contract
```

Check at least: ESM import, CommonJS require (if shipped), CSS export (if
present), `.d.ts` shape, and the exact list of tarball contents. Testing a file
in `dist/` directly does not verify the package contract.

## 14. Browser tests — When applicable

Required when behavior depends on something jsdom cannot reproduce: real focus
location, real key events over rendered markup, the browser accessibility tree,
`Enter` / `Space` activation, direction (`dir`) resolution, touch gestures, or
"does the built bundle behave the same across engines".

For a stable, published UI package the matrix is **Chromium, Firefox, WebKit**.
A pre-1.0 experiment may start with one engine and expand.

Put a test at the lowest layer that can actually exercise its risk. Deliberate
parallel coverage (a pure unit test *and* a browser test for the same feature,
each covering a different link in the chain) is fine; a third test that
re-asserts the same plain value with no new dimension is not.

## 15. Accessibility — When applicable (interactive UI)

For an interactive component, accessibility is part of the architecture, not a
later pass. The component's `ACCESSIBILITY.md` states an explicit:

- **accessibility contract** — roles, states, properties, and how they stay in
  sync;
- **keyboard contract** — every key, in a table, per orientation / direction /
  mode as relevant;
- **focus contract** — where focus goes on each interaction, and the roving
  `tabindex` rule if one applies.

If a **WAI-ARIA APG pattern** matches the component, analyze it and document
conformance against it. The pattern itself is component-specific — the Tabs
pattern does not transfer to a dialog — but *"an interactive component documents
its keyboard contract"* is a baseline that transfers to every one.

Never claim "fully accessible" or "100% WCAG compliant". State only what is true
and tested: follows a named APG pattern; tested with Playwright and axe; manually
verified with a specific tool — the last only if it actually was.

### axe automation — When applicable (renders UI)

Run axe as regression detection, on initial render and after interaction. `0 axe
violations` is not full accessibility verification and must not be described as
such.

### Manual assistive-technology matrix — When applicable (significant keyboard / focus behavior)

Prepare a manual test matrix — for example Safari + VoiceOver, Chrome + NVDA,
Firefox + NVDA — covering entry into the widget, role announcement, state
announcement, position/count if the AT reports it, each activation mode, disabled
elements, alternate orientations, RTL, and leaving the widget.

An agent may prepare the checklist. An agent may **not** mark any row `PASS` —
unperformed rows stay `TBD` until a human runs the test.

## 16. Runnable examples — Baseline

Public examples use only the public API, run as-is, stay small, and each show one
specific use case. Where it does not complicate the project, an example file may
double as a browser-test fixture. Examples are smoke-checked in CI so they cannot
rot silently.

## 17. Documentation set — When applicable (reference-grade package)

A small first release needs `README.md` and `CHANGELOG.md`. A package promoted
as a reference carries the full set:

| File | Role | Location |
| --- | --- | --- |
| `README.md` | public usage and API | root |
| `CHANGELOG.md` | user-facing change history, `[Unreleased]` on top | root |
| `LICENSE` | license | root |
| `ACCESSIBILITY.md` | keyboard / ARIA / focus contract, manual AT matrix | root |
| `AGENTS.md` | agent entry point | root |
| `docs/PROJECT.md` | why the project exists, priority order, namespace | `docs/` |
| `docs/CONTRIBUTING.md` | development rules, quality gates, agent prompts | `docs/` |
| `docs/ARCHITECTURE.md` | structure, boundaries, invariants, frozen contract | `docs/` |
| `docs/NON-GOALS.md` | features intentionally out of scope | `docs/` |
| `examples/` | runnable public-API examples | root |

`README.md` documents public behavior, not internals. `ARCHITECTURE.md` does not
duplicate the README. Each doc has one job; where topics overlap, one file owns
the topic and the others point to it.

## 18. AI agent onboarding — Baseline

`AGENTS.md` is the single, vendor-neutral source of agent instructions. It points
at the authoritative docs and states the constraints that are easy to break — it
does not restate the API or the accessibility contract (those go stale when
copied).

Vendor-specific files (`CLAUDE.md`, `GEMINI.md`, `.cursor/rules/*`, …) are thin
adapters that reference `AGENTS.md`, added only for a concrete technical need.
The same instructions are never duplicated across files.

## 19. CI gate — Baseline

Before any merge to the main branch, CI runs the checks appropriate to the
package. For a full UI component that is:

```text
build  →  unit tests + coverage gate  →  package smoke  →
type consumer compile  →  browser tests  →  axe
```

A package that does not ship a given layer omits that step; it does not lower a
threshold to pass.

## 20. Release gate and SemVer — Baseline

Release order — no shortcuts:

```text
source  →  tests  →  build  →  npm pack  →  consumer verification  →  release
```

A package is not published because the local `dist/` looks right; it is published
because the packed tarball passed verification.

SemVer:

| Bump | For |
| --- | --- |
| **PATCH** (`1.3.0 → 1.3.1`) | bug fixes, internal refactor, test/CI/doc work — **no** public-contract change |
| **MINOR** (`1.3.0 → 1.4.0`) | new backwards-compatible public capability |
| **MAJOR** | any breaking public change |

An internal refactor alone never justifies a MINOR. A breaking change is never
shipped by accident — it is called out, explained, and given a migration path.

## 21. Definition of Done — Baseline

A component is a **reference** when:

- [ ] the problem and scope are written down
- [ ] the public API is small and every element is justified
- [ ] runtime dependencies are `0`, or each is an explicit decision
- [ ] the public / private boundary is documented
- [ ] the state model is documented (if interactive)
- [ ] typings match the runtime (if shipped) and a consumer compile test passes
- [ ] unit tests pass and the coverage gate holds
- [ ] the package smoke test passes against the tarball
- [ ] browser tests pass (if the component needs them)
- [ ] axe automation passes (if it renders UI)
- [ ] the manual AT status is explicit — no auto-`PASS`
- [ ] `README.md` and `CHANGELOG.md` are current
- [ ] examples run and are covered in CI
- [ ] `AGENTS.md` is current
- [ ] CI is release-grade
- [ ] the packed tarball is safe to publish

## 22. Core principle

The standard should make the next component **faster to start without lowering
quality**. It must not make a simple component complex on day one.

```text
minimum architecture needed today  +  a clear path to grow tomorrow
```

Copy the standards, the gates, the CI concepts, the documentation structure, the
testing approach, the package conventions. Do not copy the Tabs implementation,
its API, its state model, or its accessibility model — every component designs
those for itself.

---

## Related documents

| Topic | Source |
| --- | --- |
| How `@sargadil/tabs` applies this standard | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Development rules and quality gates (Tabs) | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Why the project exists, priority order, namespace | [`PROJECT.md`](./PROJECT.md) |
| Features intentionally out of scope (Tabs) | [`NON-GOALS.md`](./NON-GOALS.md) |
| Agent entry point | [`AGENTS.md`](../AGENTS.md) |
