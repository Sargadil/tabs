# About `@sargadil/tabs`

Context for anyone — human or agent — working on this repository. The rules live
in [`CONTRIBUTING.md`](./CONTRIBUTING.md); this file is the "why".

## What it is

`@sargadil/tabs` is a lightweight, framework-agnostic, accessibility-first,
zero-runtime-dependency tabs library implementing the
[WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). The
implementation is the `Tabs` class in `src/js/script.js` plus a few internal,
non-public helper modules under `src/js/internal/`.

The goal is not a component with the maximum number of features. The goal is a
library that is:

- small,
- predictable,
- well tested,
- framework-agnostic,
- accessibility-first,
- free of runtime dependencies,
- easy to maintain.

## Priority order

When two goals conflict, the earlier one wins:

```
correctness → accessibility → tests → package quality →
developer experience → features → visual polish
```

Accessibility is treated as part of the architecture, not an add-on — it is core
to the Tabs domain specifically.

## The `@sargadil/*` namespace

`@sargadil/*` is a general namespace for the maintainer's open-source software.
It is not limited to accessibility or to UI components; future packages may cover
other areas entirely. A package's category comes from its own name, docs, and
purpose — not from the namespace.

What the namespace aims to stand for:

```
a clear problem · good API design · good documentation · tests · CI ·
maintainability · stable releases · a reasonable dependency count
```

Not every future `@sargadil/*` package carries the same accessibility bar that
`@sargadil/tabs` does.

## Role of this project

`@sargadil/tabs` is the reference project that establishes the process and the
quality standard for the namespace: package design, exports, ESM/CJS, TypeScript
declarations, CI/CD, unit + browser + accessibility testing, and the release
process. It is deliberately not the start of an assembly line of UI components —
the next project is chosen by which problem is most worth solving, not by
category.

## AI-assisted engineering

AI is part of the workflow: research, audit, implementation, tests, refactoring,
documentation. It is not hidden, and it is not the story either. The framing is:

> AI-assisted development with human-reviewed architecture, API, testing, and
> technical decisions.

The operating rule:

> AI executes. Maintainer decides.

AI-generated code is not automatically correct. Every change is evaluated for
correctness, architecture, edge cases, API design, accessibility,
maintainability, and tests. The maintainer must be able to answer: why a feature
exists, why the API looks the way it does, why a given technology was used, how
it was tested, what the limitations are, and why alternatives were rejected.

## What not to build

Design boundaries — features intentionally left out — are in
[`NON-GOALS.md`](./NON-GOALS.md). Do not implement them without an explicit
maintainer decision.
