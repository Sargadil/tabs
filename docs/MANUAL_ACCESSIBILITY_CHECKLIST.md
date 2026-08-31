# Manual accessibility verification checklist

A concrete, repeatable script for verifying `@sargadil/tabs` with real assistive
technology. It exists because the automated layers (jsdom unit tests, Playwright,
axe-core — see [`ACCESSIBILITY.md` → Automated testing](../ACCESSIBILITY.md#automated-testing))
cannot tell whether the widget is actually *usable* with a screen reader; only a
human running these steps can.

**What this document is:** the step list a maintainer follows, per
browser + assistive-technology combination, and the place the raw pass/fail
observations are recorded before the summary matrix in `ACCESSIBILITY.md` is
updated.

**What this document is not:** a second copy of the keyboard / ARIA contract
(that is [`ACCESSIBILITY.md`](../ACCESSIBILITY.md)) and not something an automated
process may fill in.

> **AI / automation may not mark any row `PASS` or `FAIL`.**
> Every result in this file and in the
> [`ACCESSIBILITY.md` matrix](../ACCESSIBILITY.md#manual-assistive-technology-test-matrix)
> stays `TBD` until a human has actually run the combination and typed the
> result in. This mirrors the rule in
> [`CONTRIBUTING.md` → Manual accessibility tests](./CONTRIBUTING.md#manual-accessibility-tests)
> and [`AGENTS.md` → What an agent must not finish on its own](../AGENTS.md#what-an-agent-must-not-finish-on-its-own).

---

## Combinations covered here

| # | OS | Browser | Assistive technology |
| --- | --- | --- | --- |
| A | macOS | Safari | VoiceOver |
| B | Windows | Chrome | NVDA |
| C | Windows | Firefox | NVDA |

These are the three the maintainer commits to running each release. The wider
`ACCESSIBILITY.md` matrix (Chrome + VoiceOver, JAWS, iOS VoiceOver, TalkBack)
uses the same procedure below when someone has the environment to run it.

---

## Before you start

### Pages to test against

Run the bundled examples locally so you are exercising the built bundle:

```
npm ci
npm run build
npm run examples      # serves http://127.0.0.1:4173/examples/<file>
```

| Scenario | Page |
| --- | --- |
| Default (horizontal, automatic activation) | `examples/basic.html` |
| Manual activation | `examples/manual-activation.html` |
| Disabled tabs | `examples/disabled.html` |
| Vertical orientation | `examples/vertical.html` |
| RTL | `examples/rtl.html` |
| Panel content / more than one group | `examples/multiple-instances.html` |
| RTL + vertical (edge combo) | `e2e/fixtures/rtl-vertical.html` |
| RTL + disabled (edge combo) | `e2e/fixtures/rtl-disabled.html` |

The [live demo](https://sargadil.github.io/tabs/) is also acceptable for the
default scenario, but it only covers that one case.

### Assistive-technology setup

- **VoiceOver (macOS):** toggle with `Cmd+F5`. "VO" below means the VoiceOver
  modifier (`Ctrl+Option`, or Caps Lock if you have remapped it). Use Safari's
  own release channel; do not test in a WebKit nightly.
- **NVDA (Windows):** start NVDA, then load the page. Keep NVDA in its default
  configuration. "Browse mode" vs "focus mode" matters — NVDA switches to focus
  mode automatically when you `Tab` onto the tablist; if it does not, press
  `NVDA+Space`. Test with the current stable NVDA release.
- Test with **speech on**, not just the braille/speech-viewer log — intonation
  and interruption behavior are part of what you are checking.
- Note the exact browser, AT, and OS build numbers in the results section; screen
  reader behavior changes between versions.

### How to read "Expected"

"Expected" describes the *information* the AT must convey, not the exact words.
Wording differs between VoiceOver and NVDA and between versions. A result is a
`PASS` when a first-time user would understand, from what they hear:

- that they are on a tab, in a set of tabs,
- which tab is selected,
- how to move between tabs,
- what happened after they acted,
- and how to get to the panel.

If the information is technically present but buried, contradictory, or announced
so late it is unusable, record it as a `FAIL` with a note.

---

## Procedure

Run every step for **each** combination (A, B, C). Each step maps to one row in
the [results grid](#results-grid).

### 1. Entering the tablist

1. Load `examples/basic.html`.
2. From the top of the page, move by `Tab` (or the AT's "next focusable" /
   "next item" command) until you reach the tab group.

**Expected**

- Focus lands on the **selected** tab (not the first tab, unless the first tab is
  the selected one), because of the roving `tabindex`.
- The AT announces, in some order: the tab's accessible name, the role "tab",
  and that it is "selected".
- If `options.ariaLabel` is set on the group (it is not in `basic.html`; it is in
  `multiple-instances.html`), the tablist's label is announced when focus first
  enters the group.

### 2. Role of the container and the tab

1. With focus on a tab, use the AT command that reads the current item's role and
   container ("VO+F3" area summary in VoiceOver; NVDA re-reads on focus and via
   `NVDA+Tab`).

**Expected**

- The tab is exposed as `role="tab"`.
- Its container is exposed as `role="tablist"` — VoiceOver typically says "tab
  group" / "in tab group"; NVDA typically says "tab" plus, on entry, the tablist.

### 3. Selected state

1. With focus on the selected tab, listen to the state.
2. Arrow to another tab (`ArrowRight` on `basic.html`).

**Expected**

- The originally selected tab is announced as "selected".
- After arrowing in automatic mode, the newly focused tab is announced as
  "selected" and the previously selected one is no longer "selected". Exactly one
  tab is ever "selected".

### 4. Count and position

1. With focus on a tab, listen for any "N of M" information.

**Expected**

- If the AT reports set position at all, it says the correct 1-based index and
  total (e.g. "1 of 3", "tab 2 of 3").
- The component does not set `aria-setsize` / `aria-posinset` itself — it relies
  on the native grouping — so it is acceptable for an AT not to announce a
  position. Record what the AT actually does; do not fail the row solely because
  position is absent, but do note it.

### 5. Automatic activation

1. On `examples/basic.html` (default `activationMode: 'automatic'`).
2. With focus in the tablist, press `ArrowRight` / `ArrowLeft`, then `Home`,
   then `End`.

**Expected**

- Each arrow press moves focus **and** selection together: the new tab is
  announced as "selected", and the AT reflects that the associated panel is now
  the visible one (e.g. reading into the panel now reads the new content).
- `Home` jumps to and selects the first tab; `End` the last.
- Arrowing past the last tab wraps to the first, and before the first wraps to
  the last — the wrap is announced like any other move, with no "edge" error.

### 6. Manual activation

1. On `examples/manual-activation.html` (`activationMode: 'manual'`).
2. With focus in the tablist, press `ArrowRight` several times **without**
   pressing `Enter` / `Space`.
3. Then press `Enter` (or `Space`) on the focused tab.

**Expected**

- While arrowing: focus moves and the AT announces the newly focused tab, but it
  is announced as **not** selected — the previously selected tab keeps its
  "selected" state and its panel stays the visible one.
- On `Enter` / `Space`: the focused tab becomes "selected", the old one loses it,
  and the panel content changes. This is the only point selection changes in
  manual mode.

### 7. Disabled tabs

1. On `examples/disabled.html`.
2. Move focus into the tablist and arrow across the full set in both directions,
   including wrapping.
3. Try `Home` and `End`.
4. Try to activate a disabled tab with `Enter` / `Space` and with a click.

**Expected**

- Disabled tabs are announced as "dimmed" / "unavailable" / "disabled" when the
  AT lands on or passes them (a natively `disabled` `<button>` — the default nav —
  is also skipped by the browser's own focus order).
- Arrow keys, `Home`, and `End` skip disabled tabs and land on the nearest
  **enabled** tab, including when wrapping past a disabled tab at either end.
- Activating a disabled tab does nothing: no selection change, no panel change,
  no announcement of a change.

### 8. Vertical navigation

1. On `examples/vertical.html` (`orientation: 'vertical'`).
2. With focus in the tablist, try `ArrowUp` / `ArrowDown`, then `ArrowLeft` /
   `ArrowRight`, then `Home` / `End`.

**Expected**

- `ArrowDown` moves to the next tab, `ArrowUp` to the previous, with wrap-around,
  each announced as in step 5 (automatic mode).
- `ArrowLeft` / `ArrowRight` do nothing in vertical orientation.
- The AT reflects the vertical orientation if it exposes orientation at all
  (`aria-orientation="vertical"` is set); this is informational, not a failure
  point if the AT stays silent about orientation.
- `Home` / `End` still jump to first / last.

### 9. RTL

1. On `examples/rtl.html` (document or wrapper `dir="rtl"`, horizontal
   orientation).
2. With focus in the tablist, press the arrow key that points **toward the next
   tab visually** — in RTL that is `ArrowLeft` — and confirm it selects the next
   tab. `ArrowRight` should go to the previous tab.
3. Check `Home` / `End` still map to first / last (they are not mirrored).
4. Optionally repeat on `e2e/fixtures/rtl-vertical.html` and
   `e2e/fixtures/rtl-disabled.html`.

**Expected**

- Arrow direction is mirrored: `ArrowLeft` = next, `ArrowRight` = previous, with
  correct wrap-around, each move announced normally.
- `Home` / `End` are unchanged (first / last).
- Announced reading order matches the visual right-to-left order.
- On the RTL + disabled fixture, disabled-skip still works with the mirrored
  directions.

### 10. Leaving the tablist

1. With focus on a tab, press `Tab` once.

**Expected**

- Focus leaves the tablist and lands on the **active panel** (it has
  `tabindex="0"`), or on the first focusable element inside the panel if that is
  how the AT/browser resolves it — not on a different tab, and not skipped past
  the panel entirely.
- `Shift+Tab` from the panel returns focus to the selected tab (not to the first
  tab).
- Only one tab is in the `Tab` sequence (roving `tabindex`), so a single
  `Shift+Tab` from the panel does not step through every tab.

### 11. Panel content

1. After switching to a tab, navigate into its panel (continue `Tab`, or use the
   AT's reading commands).

**Expected**

- The panel is exposed as `role="tabpanel"` and is labelled by its tab
  (`aria-labelledby`) — the AT associates the panel with the tab name.
- Only the **active** panel's content is reachable; inactive panels are not in
  the reading order or the accessibility tree (they carry native `hidden`).
- After switching tabs, reading into the panel reads the **new** panel's content,
  with no stale content from the previous panel.
- With more than one group on the page (`examples/multiple-instances.html`), each
  panel is associated with the correct group and the groups do not cross-wire.

---

## Results grid

Copy this block per run. Replace each `TBD` with `PASS` or `FAIL`. For any
`FAIL`, add a numbered note below with the AT/browser/OS build and what happened.

```
Run date:        YYYY-MM-DD
Tester:
Library version: (git describe / package.json version)

                                     A: Safari+VO   B: Chrome+NVDA   C: Firefox+NVDA
                                     macOS ___      Win ___          Win ___
                                     Safari ___     Chrome ___       Firefox ___
                                     VO ___         NVDA ___         NVDA ___
 1  Entering the tablist              TBD            TBD              TBD
 2  Role of container and tab         TBD            TBD              TBD
 3  Selected state                    TBD            TBD              TBD
 4  Count and position                TBD            TBD              TBD
 5  Automatic activation              TBD            TBD              TBD
 6  Manual activation                 TBD            TBD              TBD
 7  Disabled tabs                     TBD            TBD              TBD
 8  Vertical navigation               TBD            TBD              TBD
 9  RTL                               TBD            TBD              TBD
10  Leaving the tablist               TBD            TBD              TBD
11  Panel content                     TBD            TBD              TBD

Notes:
-
```

---

## After the run — updating `ACCESSIBILITY.md`

1. A combination's row in the
   [`ACCESSIBILITY.md` matrix](../ACCESSIBILITY.md#manual-assistive-technology-test-matrix)
   may move from `TBD` to `PASS` only when **every** step 1–11 for that
   combination is `PASS`. Any `FAIL` or unresolved oddity keeps the row `TBD` (or
   `FAIL` with an issue link).
2. Fill in the "Last tested" date and the browser / AT build numbers.
3. If the run surfaced a real, reproducible defect, open an issue and link it
   from the matrix row before changing anything in `src/`.
4. Keep this file's filled-in results grid (or a link to where it is stored) so
   the next run can diff against it.
5. A maintainer — not an automated change — makes these edits.

---

## Related documents

| Topic | Canonical source |
| --- | --- |
| Keyboard / ARIA / focus contract, automated test inventory, summary AT matrix | [`ACCESSIBILITY.md`](../ACCESSIBILITY.md) |
| Rule that automation may not mark manual tests done | [`CONTRIBUTING.md`](./CONTRIBUTING.md#manual-accessibility-tests) · [`AGENTS.md`](../AGENTS.md#what-an-agent-must-not-finish-on-its-own) |
| Testing layers and which layer owns what | [`ARCHITECTURE.md` → Testing layers](./ARCHITECTURE.md#testing-layers) |
| Example pages and fixtures | [`examples/`](../examples/) · [`e2e/fixtures/`](../e2e/fixtures/) |
