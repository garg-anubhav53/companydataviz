# Codebase Guide

A running log of how this project is structured and how each piece works. Updated after every meaningful change.

---

## Current State: Iteration 1 — Static Pie Chart

### What This Does

Opens in a browser as a single HTML page and renders a pie chart showing the industry breakdown of the top 100 SaaS companies. All data is hardcoded. No server, no build step, no framework.

---

## File Structure

```
companydataviz/
├── index.html            # Entry point — loads Chart.js and the chart script
├── charts/
│   └── industryPie.js    # Chart data + Chart.js constructor for the industry pie chart
├── first_spec.md         # Iteration 1 spec (what we set out to build)
├── CODEBASE.md           # This file
└── README.md             # Project overview
```

---

## How It Works

### `index.html`
The shell of the page. Responsible for:
- Page layout and basic styling (centered card, light gray background)
- Loading Chart.js from the CDN (`chart.js@4.4.7`)
- Loading `charts/industryPie.js` via a `<script>` tag after Chart.js

The `<canvas id="chart">` element is the render target. Chart.js writes the pie chart into it. The canvas sits inside a `.chart-container` div that caps the width at 700px so the chart doesn't stretch to fill the full viewport.

Chart.js must be loaded **before** `industryPie.js` because the chart script references `Chart` (the global constructor) immediately on load.

### `charts/industryPie.js`
Contains everything chart-specific:
- **`industryData`** — an object holding the labels, numeric values, and hex colors for the 6 slices
- **`new Chart(...)`** — instantiates the pie chart on the `#chart` canvas using the data above

The 6 slices represent the top 5 industries by company count, plus an "Other" bucket that captures the remaining 89 companies (out of 100 total across 85 unique industries). "Other" intentionally dominates the chart.

Chart options:
- `responsive: true` — chart scales with its container
- `title` — displayed above the chart
- `legend: { position: 'right' }` — labels shown to the right of the pie

---

## Key Decisions

| Decision | Reason |
|---|---|
| CDN for Chart.js | No build step needed; file opens directly in a browser |
| Separate JS file per chart | Keeps `index.html` clean; each chart owns its own data and config |
| `charts/` directory | Future charts (bar, scatter, etc.) will each get their own file here |
| Hardcoded data | Iteration 1 only — CSV parsing and LLM interpretation come later |

---

## What Comes Next

Per the spec, the next iterations will:
1. Load the actual CSV using PapaParse and compute counts dynamically
2. Generalize the renderer to accept a JSON "chart spec" so bar, scatter, and table charts are supported
3. Wire in an LLM to interpret natural-language prompts and generate chart specs
