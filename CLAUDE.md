# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A labor **contraction timer** web app. Markup and logic live in [index.html](index.html); styles are a **precompiled Tailwind stylesheet**, [styles.css](styles.css). There is **no package.json and no tests**, and the committed `styles.css` means the app runs with **no build for users**. Supporting files: [sw.js](sw.js) (service worker), [manifest.webmanifest](manifest.webmanifest), [logo.png](logo.png) (app icon, 1024×1024), plus the CSS build inputs [tailwind.config.js](tailwind.config.js) and [src.css](src.css).

**CSS build (only when you change classes):** styles are generated from `src.css` + `tailwind.config.js` by the Tailwind CLI — `npx tailwindcss@3 -i ./src.css -o ./styles.css --minify` — then `styles.css` is committed. (Was the Tailwind Play CDN before; precompiling dropped ~100KB of runtime JS and the FOUC.)

To run it: open `index.html` in a browser, or serve the folder (`python3 -m http.server`) and visit it. Serving over `http://localhost` (or https) matters — the Web Share API, Clipboard API (export/copy), **and the service worker** require a **secure context**, so opening via `file://` silently falls back (download / `execCommand`, no offline caching).

**PWA / offline:** `sw.js` is network-first for the page (updates show when online) and cache-first for assets (local + the version-pinned CDN libs), so after one online load the app works fully offline and is installable. Bump the `CACHE` constant in `sw.js` to force a full re-cache. Because navigation is network-first, editing `index.html` is picked up automatically when online — no version bump needed for content changes.

Remaining runtime CDN dependencies: Inter (Google Fonts) and the Preact+htm module (unpkg). The app needs network on first load to fetch these (the service worker caches them afterward for offline use).

**Icons are self-hosted inline SVGs** (the Iconoir CSS was a 2.9MB CDN file for the ~18 icons we use). They live in the `ICONS` map (name → inner SVG markup, from Iconoir's `icons/regular/*.svg`) and render via the `Icon({ name, class })` component: an `<svg width="1em" height="1em">` whose paths use `stroke="currentColor"`, so **size follows `font-size` (`text-xl` etc.) and color follows `text-*`** — same as the old `<i>` tags. To add an icon, drop its inner SVG into `ICONS` and reference the name. Gotcha: Tailwind Preflight sets `svg { display:block }`, so an icon centered by `text-center` needs `mx-auto` instead (icons inside `grid place-items-center`/flex parents are unaffected).

## Architecture

The app is **Preact + htm**, imported from a CDN inside the `<script type="module">` at the bottom of [index.html](index.html) — still **no build step and one file**. The module pins versions: `https://unpkg.com/htm@3.1.1/preact/standalone.module.js` (the standalone bundle ships Preact + htm together as one instance, exposing `html`, `Component`, `render`). htm means **markup is written in tagged template literals** (`` html`<div>…</div>` ``), not JSX — so there is nothing to compile.

- **Almost everything is one class component, `App`** (`extends Component`), holding all state in `this.state`. There are no hooks (the standalone bundle doesn't export them) — interactions call `this.setState(...)`, and immutable updates (new arrays) are what trigger re-render. A few **stateless** function components (`Modal`, `IntensityDots`, `SettingsRow`) are pure-of-props helpers. `App.render()` returns an **array** of vnodes (main content, bottom bar, then the conditionally-rendered modals).

- **Persisted state** is four `this.state` fields: `contractions` (array of `{ start, end, intensity }`, ms epochs, kept **sorted newest-first**), `activeStart` (ms while timing, else null), `selectedIntensity` (1–3), and `archives` (`{ id, archivedAt, items }[]`). Persistence is automatic: `componentDidUpdate` writes those four to the localStorage key `contraction-timer.v1` whenever any of their references change (the 200ms timer tick only changes `elapsed`, so it does **not** thrash storage). `load()` reads + validates on construction. Don't add manual `save()` calls — just `setState` with new references.

- **History indices are array positions in the sorted `contractions`.** `openEdit(i)` / `askDelete(i)` use the index into `this.state.contractions`; after any edit the list re-sorts, so always re-derive from current state.

- **Tailwind is the only styling mechanism** (utility classes inline in the templates), now **precompiled** into [styles.css](styles.css). Because purging only keeps classes it finds, any class **built dynamically in JS must appear as a literal string in `index.html`** (most do — e.g. `LEVELS[...].fill` is the literal `'bg-amber-500 border-amber-500'`) **or be added to the `safelist` in `tailwind.config.js`** (where the intensity `bg-/border-/ring-` colors and the `bg-emerald-500` met-bar live). After adding new utility classes, **rebuild `styles.css`** (see CSS build above) or they won't have styles. Non-utility CSS lives in `src.css` (compiled into `styles.css`): the theme-token `:root` variables, the `.picker` styled-select, the `accent-color` brand tint on inputs, the `row-in` keyframe, and `tabular-nums` on `body`.

- **Theming uses semantic design tokens, not `dark:` variants.** Dark mode is automatic (follows the OS via `prefers-color-scheme`). The palette is defined once as CSS variables in the `<style>` block (`--c-base`, `--c-card`, `--c-surface`, `--c-line`, `--c-track`, `--c-ink`, `--c-body`, `--c-muted`, `--c-faint`) — light values in `:root`, dark values in the `@media (prefers-color-scheme: dark)` block — and registered as Tailwind colors in the config as `rgb(var(--c-…) / <alpha-value>)`. So use the **token utilities** everywhere — `bg-page`/`bg-card`/`bg-surface`, `border-line`, `bg-track`, `text-ink`/`text-body`/`text-muted`/`text-faint` — and the theme flips for free; **do not add `dark:` variants or raw `neutral-*` colors.** (Note: the page-background token is named `page`, not `base` — a `base` color would collide with Tailwind's built-in `text-base` font-size utility and silently recolor everything using `text-base`. Avoid token names that shadow built-in utilities.) The `.picker` reads the same vars. Two more named colors in the config: **`brand-*`** (the rose-pink brand scale — Start button, 5-1-1 alert, focus rings, `accent-color`) and **`danger`** (a dark-aware token, `--c-danger`, used for the destructive "Clear all" row via `text-danger` / `border-danger/40` / `hover:bg-danger/10`). Other raw colors kept on purpose: `LEVELS` intensity colors (amber/orange/red) and the modal scrim `bg-neutral-900/30`.

- **Light is the default theme; dark is opt-in via the toggle** (the OS `prefers-color-scheme` is intentionally ignored). `:root` holds the light vars; `:root[data-theme="dark"]` re-declares the dark vars. An **inline `<head>` script** sets `<html>`'s `data-theme` from the saved value (`localStorage` key `contraction-timer.theme`), defaulting to `light`, *before paint* to avoid a flash — keep it inline and early. The header toggle button (`App.toggleTheme`) flips the attribute, persists it, swaps its sun/moon icon, and updates the `theme-color` meta. `App.state.theme` mirrors the current value for the icon.

- **Intensity** is the `LEVELS` map (1 Mild = amber, 2 Moderate = orange, 3 Strong = red — deliberately no green, since a contraction is never a "good" signal; default/floor is 1, cycled via `(n % 3) + 1`). Each entry's `fill` is a `"bg-… border-…"` string; code does `cfg.fill.split(' ')[0]` for just the bg class. Shared by history dots, the edit picker circles, and the bottom-bar intensity button.

- **Modals** are driven by `this.state.modal` (`'edit' | 'settings' | 'info' | 'archive' | null`) plus a separate `this.state.confirm` object that can overlay any of them. The shared `Modal` component renders a backdrop (click = close) + centered panel. Z-order is intentional: edit `z-30`, settings/archive `z-40`, confirm/info `z-50` (so a confirm stacks above the panel that triggered it). `openConfirm({ title, message, okLabel, onOk })` is the reusable confirm used for delete / clear / archive / import.

- **5-1-1 detection** lives in the module-level `recentStats(contractions)` (rolling **last-60-minutes** window) and `check511()`. `renderStats()` mirrors those thresholds for the three cards — avg apart (≤5.5 min), avg duration (≥45s), pattern span (≥50 min over ≥4 contractions) — filling each progress bar and turning it green only when its condition is met; the "Time to call your provider" alert shows when all pass. Keep the card thresholds and `check511` in sync.

## Domain conventions

- **Contraction frequency is measured start-to-start** (not end-to-start) everywhere — history "apart" connectors, stats, and export.
- **History indices** count chronologically from oldest = `01`; archiving the current session clears `contractions` so the live list restarts at `01`.
- **Live vs. edited records:** live recordings carry real seconds/ms; the edit modal preserves the original seconds when saving (only date/hour/min/sec fields are applied) so both keep comparable precision.
- This is a **medical-adjacent tool**. It is explicitly "tracking only, not medical advice" (stated in the footer). 5-1-1 is a general guideline and providers vary (some use 4-1-1) — don't present the alert as authoritative.

## Editing notes

- UI is built with htm `` html`…` `` templates in the `render*()` methods. htm escapes interpolated values, so text is safe — but the editor uses controlled inputs whose values are read back and **clamped in `saveEdit()`** (day to the month length, hour 1–12, min/sec 0–59); keep that clamping if you touch the picker.
- When adding a stat/format change, check every consumer: `fmtDur`, `fmtGap`, `fmtTime`, `fmtClock` are reused across the timer, history, stat cards, archive previews, and the TSV/summary export.
- Reference code as `index.html:<line>` since it's all one file.
