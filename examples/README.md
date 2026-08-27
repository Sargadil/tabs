# Examples

Small, self-contained pages — one use case each, public API only, no build step, no framework, no
runtime dependencies. Each file imports the real build (`../dist/js/tabs.mjs` and
`../dist/css/styles.min.css`), so it also serves as a check that the documented behaviour still works.

| Example | Demonstrates |
| --- | --- |
| [Basic](./basic.html) | Minimal initialization (`import` → markup → `new Tabs()`) |
| [Manual activation](./manual-activation.html) | Focus vs activation (`activationMode: 'manual'`) |
| [Vertical](./vertical.html) | Vertical keyboard navigation (`orientation: 'vertical'` + `tabs--vertical`) |
| [RTL](./rtl.html) | RTL horizontal navigation (auto-detected, no flag) |
| [Disabled](./disabled.html) | Disabled tabs behaviour (default nav + custom nav) |
| [Custom navigation](./custom-navigation.html) | Existing navigation markup (`useCustomNav: true`) |
| [Before change](./beforechange.html) | Cancelable tab switching (`tabs:beforechange` + `preventDefault()`) |
| [Events](./events.html) | Reacting to tab changes (`tabs:change`, lazy loading) |
| [Dynamic refresh](./dynamic-refresh.html) | DOM changes + `refresh()` |
| [Multiple instances](./multiple-instances.html) | Independent tab groups on one page |

## Running

ES module imports need a server (opening the files over `file://` won't work). From the repo root:

```bash
npm run build      # once, so dist/ exists
npm run examples   # static server on http://127.0.0.1:4173
```

Then open e.g. `http://127.0.0.1:4173/examples/basic.html`.

Any other static server works too (`npx serve`, `python3 -m http.server`, …) as long as it's rooted
at the repo so `../dist/...` resolves.
