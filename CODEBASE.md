# Codebase Guide

A running log of how this project is structured and how each piece works. Updated after every meaningful change.

---

## Current State: Iteration 2 — Tabbed Interface with Pie + Scatter Charts

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

- Contains 88 company data points as `{ x: foundedYear, y: valuationBillions, label: name }`
- Calls `new Chart(...)` with `type: 'scatter'`
- Returns the Chart instance

Key details:
- **Y-axis is logarithmic** (`type: 'logarithmic'`) — the valuation range spans $1.1B to $3,000B; a linear scale would collapse 80% of dots to the bottom
- **Tick filtering** — Chart.js generates many intermediate ticks on log scales; the `ticks.callback` only labels $1B, $10B, $100B, $1000B to avoid clutter
- **Custom tooltips** — `ctx.raw.label` accesses the company name from each data point; Chart.js scatter ignores extra fields on `{x, y}` objects but they're accessible in callbacks

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
