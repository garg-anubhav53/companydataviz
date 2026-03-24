# Codebase Guide

How this project is structured and how each piece works. Updated after every meaningful change.

---

## What This Is

A pure-frontend data visualization tool. No server, no build step, no framework — every file opens directly in a browser by double-clicking.

**Stack:** HTML + vanilla JavaScript + Chart.js 4.4.7 (loaded from CDN)

---

## Current State: Iteration 3

Three charts, all hardcoded data:

| Chart | File | Description |
|---|---|---|
| Pie | `charts/industryPie.js` | Industry breakdown of top 100 SaaS companies |
| Scatter | `charts/foundedValuationScatter.js` | Founded year vs. valuation (log scale) |
| Bar | `charts/investorBar.js` | Most frequent investors by portfolio count |

The pie and scatter charts are accessible via tabs in `index.html`. The bar chart is standalone in `investors.html`.

---

## File Structure

```
companydataviz/
├── index.html                           # Tabbed UI — pie and scatter charts
├── scatter.html                         # Standalone scatter (isolated testing)
├── investors.html                       # Standalone investor bar chart
├── main.js                              # Tab switching + lazy chart initialization
├── charts/
│   ├── industryPie.js                   # Pie chart
│   ├── foundedValuationScatter.js       # Scatter chart
│   └── investorBar.js                   # Horizontal bar chart
├── iterative_specs/                     # Per-iteration build specs
├── test_outputs/                        # Screenshots for visual QA
├── CODEBASE.md                          # This file
└── README.md                            # Project overview
```

---

## How It Works

### `index.html`

The main entry point. Contains:
- Page layout and tab styling
- Two `.tab-panel` divs (one per chart), each with a `<canvas>`
- Script tags loading Chart.js then the chart files then `main.js`

Script load order matters — Chart.js must come first (defines the global `Chart`), chart files second (define the `init` functions), `main.js` last (calls those functions):

```
chart.js (CDN) → industryPie.js → foundedValuationScatter.js → main.js
```

### `main.js`

Owns all tab logic. The `CHART_INIT` map connects each tab name to its initializer:

```javascript
const CHART_INIT = {
  pie:     () => initIndustryPie('pie-canvas'),
  scatter: () => initFoundedValuationScatter('scatter-canvas'),
};
```

Adding a new tab = one new entry in `CHART_INIT` plus the corresponding HTML panel.

`showTab(tabName)` toggles the active button, shows/hides panels, and lazily initializes the chart on first visit. Lazy init matters because Chart.js needs a visible, sized canvas to compute dimensions correctly — initializing into a hidden canvas produces a broken layout.

Chart instances are stored in `chartInstances` so each chart is only created once.

### `scatter.html` / `investors.html`

Standalone pages for isolated testing — useful for verifying a chart without the tab layer in the way. Each loads only the script it needs and calls the init function directly.

---

## Chart Files

Each chart file exports one function: `initXxx(canvasId)`. It defines the data, builds the Chart.js config, and returns the Chart instance.

### `charts/industryPie.js` — `initIndustryPie(canvasId)`

Straightforward pie chart. Labels, values, and colors are defined in a single `industryData` object for easy scanning.

### `charts/foundedValuationScatter.js` — `initFoundedValuationScatter(canvasId)`

The most complex chart. Data goes through a pipeline before reaching Chart.js:

1. **Filter** — drops any point where `y` is null, non-finite, or `≤ 0`. The log scale is undefined at zero and would crash silently.
2. **Jitter** — many companies share the same founding year (12 were founded in 2011). Without adjustment, their dots stack directly on top of each other. `charSum()` sums the char codes of the company name to produce a small, stable x-offset (±0.3 years). Using char codes instead of `Math.random()` means the positions are identical on every page load.
3. **Preserve original year** — the jittered `x` drives dot position; the original `year` is kept separately for tooltips.

Y-axis details:
- `type: 'logarithmic'` with explicit `min: 1, max: 10000` — without `min: 1`, Chart.js auto-selects a floor below 1, producing a broken tick label
- Tick callback uses a **relative tolerance check** (`Math.abs(value - t) / t < 0.01`) instead of `===` because Chart.js emits log-scale tick values as floats that rarely equal round numbers exactly
- Only four ticks are labeled: `$1B`, `$10B`, `$100B`, `$1T`

X-axis: `min: 1969, max: 2021` gives margin so SAP (1972) and Ramp (2019) aren't flush against the edges. Tick callback suppresses fractional-year values introduced by jitter.

### `charts/investorBar.js` — `initInvestorBar(canvasId)`

Horizontal bar chart using `indexAxis: 'y'` (the Chart.js v4 approach — `type: 'horizontalBar'` was removed in v4).

`wrapCompanies(str, maxLen)` breaks the long portfolio company strings into lines of at most 60 characters for the tooltip, so the tooltip doesn't overflow the viewport on investors with large portfolios like Sequoia (18 companies).

---

## Key Decisions

| Decision | Reason |
|---|---|
| `init` functions, not immediate execution | `main.js` controls when charts run; prevents rendering into hidden canvases |
| Lazy init on first tab click | Chart.js needs a visible canvas to compute dimensions |
| `CHART_INIT` map in `main.js` | Adding a new chart tab is one line, not a new `if` block |
| `charSum` jitter instead of `Math.random()` | Positions are stable across page reloads |
| Relative tolerance for log tick matching | Float precision makes strict `===` unreliable on log scales |
| Explicit `min`/`max` on log Y-axis | Prevents Chart.js from auto-choosing a sub-1 floor |
| CDN for Chart.js | No build step needed |

---

## What Comes Next

1. Load real data from CSV using PapaParse (replaces hardcoded arrays)
2. Build a `renderChart(canvasId, config)` generic renderer driven by a JSON spec
3. Wire in an LLM to interpret natural-language prompts and produce those specs
