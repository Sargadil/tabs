# Contributing to `@sargadil/tabs`

## Development philosophy

`@sargadil/tabs` is meant to stay a small and predictable library. More features
does not automatically mean a better product.

The priority order that settles conflicts between goals is in
[`PROJECT.md`](./PROJECT.md#priority-order); the structure and invariants are in
[`ARCHITECTURE.md`](./ARCHITECTURE.md). This file is the day-to-day rules.

---

# Working with tickets

Work is delivered as numbered tickets (`ROADMAP-N`), one at a time. The
maintainer provides the ticket to implement; each one is self-contained.

Full reusable prompts (implementation + review) are in the
[Agent prompts](#agent-prompts) section.

Before implementing:

1. read the whole ticket,
2. inspect the current code,
3. check the existing tests,
4. check whether the ticket still matches the current state of the project,
5. do not assume the ticket is an exact description of the implementation.

If the code has been changed since the ticket was written, adapt the solution to the current
architecture.

---

# Scope discipline

While implementing a single ticket:

```text
implement only the requested ticket
```

Do not implement parts of later tickets "while you're at it".

Example:

If you are working on:

```text
ROADMAP-8 — RTL
```

do not also add:

```text
disabled tabs
refresh()
data-state
View Transitions
```

even if it looks easy.

---

# Backward compatibility

Prefer changes that are:

```text
non-breaking
```

and:

```text
opt-in
```

where that makes sense.

Breaking changes may only be introduced deliberately.

If an implementation requires a breaking change:

1. call it out explicitly,
2. explain why,
3. propose a migration path,
4. never make a breaking change by accident.

---

# Runtime dependencies

General rule:

```text
runtime dependencies = 0
```

A new runtime dependency needs strong justification.

Dev dependencies are acceptable for:

```text
testing
build
linting
development tooling
```

Do not add a runtime dependency just to save a few lines of code.

---

# Public API

The public API should stay small.

Before adding a new feature, answer:

```text
1. What problem does it solve?
2. Does that problem occur in real applications?
3. Can it be solved with the existing API?
4. Does the feature increase maintenance cost?
5. Will the feature have to be maintained across future major versions?
```

If there is no good answer:

```text
do not add the feature
```

---

# State

Do not duplicate state without a reason.

If state is already represented by:

```text
aria-selected
hidden
native HTML state
```

do not automatically add further representations such as:

```text
data-state
custom attributes
extra internal flags
```

Every additional source of state increases the risk of desynchronization.

---

# Accessibility

Accessibility is part of this project's architecture.

Do not treat it as something bolted on after a feature is implemented.

Prefer:

```text
native HTML
↓
ARIA only where needed
↓
custom behavior
```

Do not use ARIA to recreate behavior that native HTML already provides, without a reason.

---

# Accessibility claims

Do not use statements like:

```text
Fully accessible
100% WCAG compliant
Guaranteed WCAG compliance
```

if they cannot be proven unambiguously.

Prefer precise information:

```text
Follows the WAI-ARIA Tabs Pattern.
```

```text
Tested with Playwright and axe.
```

```text
Manually verified with VoiceOver on Safari.
```

The last one only if it was actually verified.

---

# Manual accessibility tests

AI must not mark screen reader tests as done.

Tests such as:

```text
VoiceOver
NVDA
JAWS
TalkBack
```

may be marked PASS only after an actual manual test.

If they were not performed:

```text
TBD
```

---

# Testing requirements

Every new public behavior should have a test.

Preferred levels:

```text
unit/integration
↓
package smoke
↓
browser
↓
accessibility
```

Not every feature needs every level, but pick the test that matches the risk.

---

# Unit tests

Unit tests should cover:

- the public API,
- state transitions,
- edge cases,
- configuration errors,
- event behavior.

Tests should verify behavior, not just internal implementation.

They live in `test/`, one `*.test.js` file per behavior area (`initialization`,
`configuration`, `selection`, `keyboard-navigation`, `disabled`, `events`,
`refresh`, `lifecycle`), plus `keyboard.test.mjs` for the pure keyboard module.
`test/helpers/setup.js` has the shared `setup()` boot and event helpers;
`test/helpers/fixtures.js` has the markup builders (`tabsHtml`, `customNavHtml`,
`panels`, `customNavConfig`). Keep fixture specs explicit at the call site
(which tab is disabled, how many, their labels); deliberately malformed markup
stays inline in the test that checks it. Add a new test to the file whose
behavior it exercises.

---

# Package tests

If a change touches:

```text
exports
package.json
build
CJS
ESM
CSS exports
types
```

it must also be checked through an actual:

```text
npm pack
```

Testing a file in `dist/` directly is not enough to verify the package contract.

---

# Browser tests

Behavior that depends on:

```text
focus
keyboard
DOM
browser events
```

should have a Playwright test.

---

# Accessibility tests

Automated accessibility testing should use axe where it makes sense.

Remember:

```text
0 axe violations != full accessibility compliance
```

Automated tests do not replace manual review.

---

# Error messages

Public errors should be readable.

Preferred format:

```text
[@sargadil/tabs] ...
```

Example:

```text
[@sargadil/tabs] "orientation" must be "horizontal" or "vertical".
```

Avoid situations where the user only gets:

```text
Cannot read properties of undefined
```

---

# TypeScript

Every public API change must be reflected in the declarations.

Prefer strict types:

```ts
activationMode?: 'automatic' | 'manual';
```

instead of:

```ts
activationMode?: string;
```

Public types and runtime behavior must stay in sync.

---

# Documentation

The README should document public behavior, not internal implementation details.

After a public API change, check:

- installation,
- examples,
- configuration,
- API,
- events,
- TypeScript,
- accessibility,
- browser behavior.

---

# CHANGELOG

User-facing changes should be recorded in the CHANGELOG.

This applies in particular to:

```text
new features
bug fixes
behavior changes
new public API
deprecated API
breaking changes
```

There is no need to record every internal refactor.

---

# CSS

Core functionality must not depend on the bundled CSS.

JavaScript/HTML is responsible for:

```text
state
semantics
accessibility
behavior
```

CSS is responsible for:

```text
presentation
layout
visual appearance
optional animation
```

---

# Animations

Accessibility and correctness take precedence over animation.

Do not delay:

```text
hidden
ARIA state
focus state
```

just to preserve a visual effect.

Do not grow the core with advanced animation APIs without a real use case.

---

# Framework independence

The core stays:

```text
framework-agnostic
```

Do not add a dependency on:

```text
React
Vue
Angular
Svelte
```

Framework wrappers are separate potential projects and do not belong in the core.

---

# Dynamic DOM

Prefer an explicit API:

```js
tabs.refresh();
```

over automatic observation of the whole DOM.

Do not add a MutationObserver without a clear justification.

---

# AI-assisted work

The workflow, the "AI executes / maintainer decides" rule, and the review
checklist for AI-generated changes are in
[`PROJECT.md`](./PROJECT.md#ai-assisted-engineering).

For this repo specifically: a low implementation cost is never an argument for
expanding the public API or the options object.

---

# Agent prompts

Reusable templates for day-to-day work with a coding agent. `AGENTS.md` and
`CLAUDE.md` link here instead of copying the content.

## Implementing a ticket

```text
Implement the ROADMAP-X ticket according to the ticket and docs/CONTRIBUTING.md.

Before coding, inspect the current implementation and tests.

Implement only this ticket.
Do not implement future roadmap items or unrelated refactoring.

After implementation:
- run the suites relevant to the change (AGENTS.md -> How to verify):
  behavior -> test:coverage (100% gate), packaging -> test:package + npm pack,
  keyboard/focus/ARIA -> test:e2e,
- run build,
- update script.d.ts / README / CHANGELOG where public behavior changed,
- verify every acceptance criterion,
- summarize changes and remaining manual actions.
```

## Reviewing a ticket

Run per ticket. A whole-library audit is a separate `ROADMAP-14` ticket —
complementary, not a duplicate.

```text
Review the ROADMAP-X implementation as a senior open-source maintainer.
Do not modify anything.

Compare the current implementation against:
- the ROADMAP-X ticket,
- docs/CONTRIBUTING.md,
- ACCESSIBILITY.md,
- the existing public API and src/js/script.d.ts,
- the existing tests.

Look for:
- missing acceptance criteria,
- regressions,
- edge cases,
- accidental breaking changes,
- unnecessary complexity,
- undocumented behavior,
- insufficient tests,
- CHANGELOG (Unreleased) not updated for a user-facing change.

Return: PASS / FAIL / RISKS / RECOMMENDED FIXES
(RECOMMENDED FIXES is a list for a human / follow-up prompt; this review changes nothing.)

Do not discuss future roadmap features.
```

---

# Definition of Done — ticket

A `ROADMAP-X` is DONE only when:

- [ ] the implementation is complete
- [ ] there are tests for the new behavior
- [ ] all previous tests still pass
- [ ] the build passes
- [ ] typings were updated if needed
- [ ] the README was updated if public behavior changes
- [ ] the CHANGELOG was updated for a user-facing change
- [ ] no accidental breaking change was introduced
- [ ] no unjustified runtime dependency was added
- [ ] no parts of later tickets were implemented
- [ ] the solution was reviewed for edge cases
- [ ] the solution stays as simple as possible

---

# Definition of Done — release

A release is ready only when:

- [ ] the build passes
- [ ] unit tests pass
- [ ] package smoke tests pass
- [ ] browser tests pass
- [ ] accessibility tests pass
- [ ] the public API matches the documentation
- [ ] the TypeScript declarations match the runtime API
- [ ] package contents were checked
- [ ] the CHANGELOG is up to date
- [ ] the version is set correctly
- [ ] the manual accessibility matrix contains no false claims

---

# Core development rule

For every decision, prefer:

```text
simple > clever
standard > custom
explicit > magical
tested > assumed
small API > feature-rich API
maintainable > impressive
```
