# `@sargadil/*` Interactive Component Standard

## Purpose

This document defines the baseline quality standard for future interactive
components published under `@sargadil/*`.

Not every `@sargadil/*` package has to be a UI component.

This standard applies primarily to libraries similar to:

```text
@sargadil/tabs
@sargadil/accordion
@sargadil/dialog
...
```

Do not copy the Tabs API into other components.

Do copy:

```text
quality standard
project structure
testing philosophy
documentation quality
release discipline
```

---

# 1. Package philosophy

A component should exist only when it solves a concrete problem.

Prefer:

```text
small
focused
predictable
standards-based
framework-agnostic
```

Do not aim for the maximum number of features.

---

# 2. Namespace

Packages:

```text
@sargadil/<package>
```

`@sargadil` is the author's general-purpose namespace.

It does not automatically imply:

```text
accessibility package
UI package
```

---

# 3. Runtime dependencies

Default:

```text
0 runtime dependencies
```

A dependency may be added only if:

* it solves a significant problem,
* implementing it locally is not worthwhile,
* its maintenance cost is lower than its benefit.

---

# 4. Public API

The public API should be minimal.

Every element of the public API becomes a maintenance commitment.

Before adding to the API, answer:

```text
Why does this need to be public?
Can the same result be achieved with existing API?
Will we support it in future major versions?
```

---

# 5. Framework independence

Core interactive components should stay framework-agnostic.

Do not add to the core:

```text
React
Vue
Angular
Svelte
```

Framework wrappers, if ever needed, should be separate packages.

---

# 6. Native platform first

Preference:

```text
native HTML
↓
platform APIs
↓
ARIA
↓
custom behavior
```

ARIA should not replace native HTML without a reason.

---

# 7. Accessibility

For interactive UI, accessibility is part of the architecture.

Every component should have an explicit:

```text
accessibility contract
keyboard contract
focus contract
```

If a relevant WAI-ARIA APG pattern exists, analyze it.

Do not claim:

```text
fully accessible
100% WCAG compliant
```

without grounds.

---

# 8. Source structure

Preferred baseline:

```text
src/
├── js/
│   ├── <component>.js
│   └── internal/
│       ├── config.js
│       ├── keyboard.js
│       └── dom.js
└── scss/
```

This is not a rigid structure.

Create internal modules only where there is a clear responsibility boundary.

Avoid:

```text
30 files containing 10 lines each
```

just as much as:

```text
one 3000-line file
```

---

# 9. Public/private boundary

Only these are public:

* documented exports,
* documented methods,
* documented options,
* documented events.

Internal file paths should never be treated as public API.

---

# 10. State model

Every interactive component should clearly describe:

```text
states
transitions
DOM representation
focus representation
```

Do not duplicate state without a concrete need.

---

# 11. TypeScript

If a package ships TypeScript declarations:

* the public API must be fully described,
* constrained options should use union types,
* the typings must match the runtime,
* the package should have a real consumer compile test.

Checking that `.d.ts` is present in the tarball is not enough.

---

# 12. Unit tests

Test behavior, not the private implementation.

Organize by domain:

```text
initialization
configuration
interaction
events
lifecycle
```

Not by private method name.

---

# 13. Browser tests

Interactive components should have real browser tests when behavior depends on:

```text
focus
keyboard
DOM
browser events
```

Preferred matrix for a stable component package:

```text
Chromium
Firefox
WebKit
```

---

# 14. Accessibility automation

For interactive components, use a tool such as axe as regression detection.

Rule:

```text
0 axe violations
!=
full accessibility verification
```

---

# 15. Manual accessibility verification

For components with significant keyboard/focus behavior, prepare a manual matrix.

For example:

```text
Safari + VoiceOver
Chrome + NVDA
Firefox + NVDA
```

Mark tests that were not performed as:

```text
TBD
```

Never mark them as PASS automatically.

---

# 16. Package smoke tests

Every published package should test the real tarball:

```text
npm pack
```

Check at least:

```text
ESM
CommonJS, if supported
CSS exports, if present
TypeScript declarations
package contents
```

---

# 17. Examples

Public examples should:

* use only the public API,
* be runnable,
* be small,
* show one specific use case.

Where possible without complicating the project:

```text
documentation example
+
browser fixture
```

may be shared.

---

# 18. Documentation set

A mature interactive package may have:

```text
README.md
CHANGELOG.md
CONTRIBUTING.md
ACCESSIBILITY.md
ARCHITECTURE.md
AGENTS.md
CLAUDE.md
examples/
```

Not every file is required for a small experiment.

They should be in place before a package is considered a reference.

---

# 19. AI agent onboarding

Prefer:

```text
AGENTS.md
```

as the vendor-neutral source of instructions.

Vendor-specific files should be thin adapters.

Do not duplicate the same instructions across multiple files.

---

# 20. CI

Before merge/release, the checks appropriate for the project should pass:

```text
build
unit tests
package smoke
type consumer test
browser tests
accessibility automation
```

---

# 21. Release gate

Before publish:

```text
source
↓
tests
↓
build
↓
npm pack
↓
consumer verification
↓
release
```

Do not publish a package just because the local `dist/` looks correct.

---

# 22. SemVer

## PATCH

For example:

```text
1.3.0 → 1.3.1
```

for:

* bug fixes,
* internal refactor,
* test improvements,
* documentation corrections,
* CI improvements,

with no change to the public contract.

## MINOR

For example:

```text
1.3.0 → 1.4.0
```

for new backwards-compatible public capabilities.

## MAJOR

For breaking public changes.

An internal refactor alone does not justify a MINOR.

---

# 23. Definition of Done — reference component

A component is a reference when:

* [ ] the problem and scope are clearly defined
* [ ] the public API is small
* [ ] runtime dependencies are justified
* [ ] architecture boundaries are clear
* [ ] the typings match the runtime
* [ ] unit tests pass
* [ ] package smoke passes
* [ ] the type consumer test passes
* [ ] browser tests pass
* [ ] accessibility automation passes
* [ ] the manual accessibility status is explicit
* [ ] the README is up to date
* [ ] the examples work
* [ ] the CHANGELOG is up to date
* [ ] CI is release-grade
* [ ] AGENTS.md is up to date
* [ ] the package is safe to publish

---

# 24. Reuse rule

When building the next component:

Do not copy the Tabs implementation blindly.

Copy:

```text
repository standards
quality gates
CI concepts
documentation structure
testing approach
package conventions
```

Every component must have its own:

```text
state model
accessibility model
keyboard contract
API design
```

---

# 25. Core principle

The standard should make future projects faster to start without lowering
quality.

It must not make a simple component overly complex from day one.

Prefer:

```text
minimum architecture needed today
+
clear path to grow tomorrow
```
