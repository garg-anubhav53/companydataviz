# Codebase Guide

A running log of how this project is structured and how each piece works. Updated after every meaningful change.

---

## Current State: Iteration 2b — Scatter Chart Polish + Edge Case Hardening

### What This Does

Opens in a browser as a single-page tabbed app. Two tabs let you switch between:
- **Industry Breakdown** — pie chart of the top 5 industries across 100 SaaS companies
- **Valuation vs. Founded Year** — scatter plot of 88 companies on a logarithmic valuation axis

All data is hardcoded. No server, no build step, no framework. Every file opens directly in a browser.

---

## File Structure

```
companydataviz/
├── index.html                          # Entry point — tabbed UI, loads all scripts
├── scatter.html                        # Standalone scatter chart for isolated testing
├── main.js                             # Tab switching logic, chart initialization
├── charts/
│   ├── industryPie.js                  # Pie chart: data + Chart.js config
│   └── foundedValuationScatter.js      # Scatter chart: data + Chart.js config
├── iterative_specs/
│   ├── pie_first_spec.md               # Iteration 1 spec
│   └── scatter_second_spec.md          # Iteration 2 spec
├── CODEBASE.md                         # This file
└── README.md                           # Project overview
```

---

## How It Works

### `index.html`
The main entry point. Responsible for:
- Page layout: header, tab buttons, a single shared `.chart-container` div
- Two `.tab-panel` divs (one per chart), each containing a `<canvas>`
- Loading Chart.js from CDN, then all three JS files in order

Script load order matters:
```
chart.js (CDN) → charts/industryPie.js → charts/foundedValuationScatter.js → main.js
```
Chart scripts must load before `main.js` because `main.js` calls their `init` functions.

### `scatter.html`
A standalone page for the scatter chart only — useful for verifying the chart in isolation without the tab scaffolding. Loads `foundedValuationScatter.js` and calls `initFoundedValuationScatter('scatter-canvas')` directly.

### `main.js`
Owns all tab behavior. On `DOMContentLoaded`:
- Attaches click handlers to every `.tab-btn`
- Calls `showTab('pie')` to activate the default tab

`showTab(tabName)` does three things:
1. Toggles `.active` class on the tab buttons
2. Toggles `.hidden` (display:none) on the `.tab-panel` divs
3. Lazily initializes a chart the first time its tab is shown — this avoids Chart.js rendering into a hidden canvas before dimensions are known

Chart instances are stored in a `chartInstances` object so they aren't created twice and can be referenced later (e.g., for destroy/resize).

### `charts/industryPie.js`
Exposes one function: `initIndustryPie(canvasId)`.

- Contains the hardcoded industry labels, values, and hex colors as a plain object
- Calls `new Chart(...)` with `type: 'pie'`
- Returns the Chart instance
- Data: 6 slices — top 5 industries by company count, plus "Other" (89/100 companies)

### `charts/foundedValuationScatter.js`
Exposes one function: `initFoundedValuationScatter(canvasId)`.

- Contains 88 company data points stored as `RAW_DATA` with `{ x, y, label }`
- Filters and transforms `RAW_DATA` into `DATA` before passing to Chart.js
- Calls `new Chart(...)` with `type: 'scatter'`
- Returns the Chart instance

**Data pipeline (RAW_DATA → DATA):**
1. **Filter invalid points** — drops any entry where `y` is null, non-finite, or `≤ 0`. Log scale is undefined at zero; bad data would crash the chart silently.
2. **Deterministic x-jitter** — many companies share the same founding year (e.g., 12 founded in 2011), which stacks dots directly on top of each other. A `charSum()` function sums the char codes of the company name and uses the result to offset x by up to ±0.3 years. This is deterministic (same label → same offset every render) so the chart doesn't shift on reload.
3. **Preserve original year** — jittered `x` is used for positioning; original `year` is stored separately for display in tooltips.

**Y-axis (logarithmic):**
- `min: 1, max: 10000` explicitly set — prevents Chart.js from auto-choosing a min below 1, which was causing a spurious `$1` label at the bottom without the `B` suffix
- Tick callback uses a **floating-point safe** check (`Math.abs(value - t) / t < 0.01`) instead of strict equality — Chart.js generates log-scale ticks as floats that may not exactly equal 1, 10, 100, etc.
- Ticks labeled: `$1B`, `$10B`, `$100B`, `$1T` (Microsoft's ~$3T sits within the $1T–$10T band)

**X-axis:**
- `min: 1969, max: 2021` provides margin so edge companies (SAP 1972, Ramp 2019) aren't flush against the axis
- Tick callback only labels multiples of 5 — suppresses fractional-year ticks that the jitter offsets can create

**Legend:** disabled (`display: false`) — redundant with the chart title.

**Tooltips:** format valuation as `$3T` for values ≥ 1000B, `$85B` otherwise. Shows company name, valuation, and original (un-jittered) founding year.

---

## Key Decisions

| Decision | Reason |
|---|---|
| Chart functions, not immediate execution | Lets `main.js` control when each chart initializes; avoids rendering into hidden canvases |
| Lazy init on tab click | Charts need a visible, sized canvas to compute layout correctly |
| One canvas per tab panel | Chart.js binds to a specific canvas element; simpler than destroying/recreating |
| `scatter.html` standalone | Quick isolated verification without the tab layer in the way |
| `charts/` directory | Each chart owns its own file; adding a new chart = adding a new file here |
| CDN for Chart.js | No build step; files open directly by double-clicking |
| RAW_DATA → DATA pipeline in scatter | Separates source data from display data; makes it easy to add more transforms (filtering, normalization) as the project grows |
| Deterministic jitter via charSum | Avoids `Math.random()` so the chart renders identically on every load — random jitter would move dots around each refresh |
| Floating-point safe tick callback | `value === 1` fails silently on log scales because Chart.js emits `0.9999...` or `1.000...1`; relative tolerance check is robust regardless of float precision |

---

## Emerging Pattern

Each chart file follows the same shape:
```javascript
function initXxx(canvasId) {
  const DATA = [ ... ];
  return new Chart(document.getElementById(canvasId), { type, data, options });
}
```

This is groundwork for a future `renderChart(canvasId, config)` generic renderer. When an LLM generates chart specs, the `init` functions become unnecessary — the renderer just passes the LLM-produced config straight to `new Chart()`.

---

## What Comes Next

Per the specs, the next iterations will:
1. Load the actual CSV using PapaParse and compute data dynamically
2. Generalize into a `renderChart(canvasId, config)` renderer that accepts a JSON chart spec
3. Wire in an LLM to interpret natural-language prompts and generate chart specs
