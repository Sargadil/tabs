# Non-goals — what not to build

Everything here is intentionally out of scope. Do not implement it
opportunistically, "while you're at it", or because it is cheap to generate. Each
item is revisited only in response to a real, demonstrated need, and only as an
explicit decision by the maintainer.

See also [`CONTRIBUTING.md`](./CONTRIBUTING.md) → *Scope discipline*, *Public
API*, *Runtime dependencies*, *State*, *Framework independence*.

## Deferred features

| Not this | Instead / why |
| --- | --- |
| `data-state="active"` / `data-state` attributes, or any other extra state mirror | State is already expressed by `aria-selected`, the native `hidden` attribute, and the styling-hook CSS class. Another source of truth only risks desync. |
| View Transitions API in the core | Out of the core. At most a consumer-side recipe/example. |
| `addTab()` / `removeTab()` / `updateTab()` — an imperative tab-management API | The consumer mutates the DOM and calls `refresh()`. The DOM stays the consumer's responsibility. |
| An automatic `MutationObserver` watching the markup | Explicit `refresh()` only. |
| First-letter type-ahead selection | Not part of the core WAI-ARIA Tabs Pattern; no demonstrated need. |
| A gesture library / expanded swipe handling | `options.swipeable` stays a small, opt-in convenience — it does not grow into a gesture system. |
| React / Vue / Angular / Svelte wrappers or bindings, in this repo | The core stays framework-agnostic. A wrapper would be a separate project, created only if real demand appears. No framework code in `src/`. |
| A monorepo restructure | Not now. |

## Cross-cutting

- **No new runtime dependencies.** Dev dependencies for testing / build / tooling are fine.
- **Do not grow the public API or the options object** without a concrete problem the existing API cannot solve. The surface is intentionally small and frozen — see [`ARCHITECTURE.md`](./ARCHITECTURE.md#public-contract).
- **No vendor-specific agent instruction files** (`GEMINI.md`, `.cursor/rules/*`, `.github/copilot-instructions.md`, …). `AGENTS.md` is the single neutral source; add a vendor file only for a concrete technical need.
- **No unqualified accessibility claims** ("fully accessible", "100% WCAG compliant"). State only what is true and tested: follows the WAI-ARIA Tabs Pattern; tested with Playwright and axe; manually verified with a given tool only if it actually was.
- **No breaking changes by accident.** If one is genuinely needed: call it out, explain why, provide a migration path.
