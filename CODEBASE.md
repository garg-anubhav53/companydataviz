# Codebase Guide

How this project is structured and how each piece works. Updated after every meaningful change.

---

## What This Is

A chat-driven data visualization tool. Type a natural-language prompt, get a chart back. A Node/Express server proxies prompts to Claude, which returns a chart ID. The frontend loads real CSV data via PapaParse and renders the matching chart in the chat thread.

**Stack:** Node.js + Express · Anthropic API (Claude) · Chart.js 4.4.7 · PapaParse 5 · Vanilla JS

---

## Current State: Iteration 5

Four charts, all driven by live CSV data, with comprehensive data verification:

### Recent Improvements
- **Enhanced ARR vs Valuation chart** - Added reference lines at 5x, 10x, 20x, 50x multiples with improved labeling
- **Data verification system** - Comprehensive validation of CSV parsing and chart data integrity
- **Clean codebase** - Removed debug code and temporary files for production readiness
- **Improved label positioning** - Fixed multiplier label cutoff issues with conservative positioning

| chart_id      | Chart type     | Description                                |
|---------------|----------------|--------------------------------------------|
| `pie`         | Pie            | Industry breakdown — computed from CSV     |
| `scatter`     | Scatter (log Y)| Founded year vs. valuation                 |
| `investors`   | Horizontal bar | Top 15 investors by portfolio count        |
| `arr-scatter` | Scatter (log)  | ARR vs. valuation with reference lines (5x, 10x, 20x, 50x) |

---

## File Structure

```
companydataviz/
├── server.js                          # Express server + API routes
├── .env                               # ANTHROPIC_API_KEY (gitignored)
├── .env.example                       # Template for .env
├── package.json                       # npm config — "start": "node server.js"
├── CODEBASE.md                        # This file
├── Claude.md                          # System prompt and mental model
├── README.md                          # Basic project info
├── VERIFICATION_REPORT.md             # Data verification results
├── data_verification.md               # SQL specifications (archived)
├── iterative_specs/                   # Development specifications
│   ├── add_llm_chat.md               # LLM integration spec
│   ├── check_data_correctness.md     # Data verification tasks
│   ├── hard_typed_investor_table.md  # Investor table spec
│   ├── pie_first_spec.md              # Pie chart spec
│   ├── scatter_second_spec.md         # Scatter chart spec
│   └── use_source_data.md             # CSV migration spec
└── public/                            # Everything served as static files
    ├── index.html                     # Chat UI shell
    ├── main.js                        # Chat logic, data loading, chart rendering
    ├── data.js                        # CSV loader + currency normalizer
    ├── data-verification.js           # Data verification tools
    ├── companies.csv                  # The dataset
    ├── charts/
    │   ├── industryPie.js             # initIndustryPie(canvasId, data)
    │   ├── foundedValuationScatter.js # initFoundedValuationScatter(canvasId, data)
    │   ├── investorBar.js             # initInvestorBar(canvasId, data)
    │   └── arrValuationScatter.js     # initArrValuationScatter(canvasId, data)
    ├── scatter.html                   # Standalone scatter (dev/testing)
    └── investors.html                 # Standalone investor bar (dev/testing)
```

---

## How It Works

### Running the app

```bash
cp .env.example .env      # add your Anthropic key
npm install
npm start                 # http://localhost:3000
```

### `server.js`

Three routes:
- **`GET /api/key-status`** — returns `{ hasKey: bool }` so the UI knows whether to show the key input.
- **`GET /api/test-key`** — makes a real 1-token ping to Anthropic (using Haiku) to verify the key actually works, not just that it exists.
- **`POST /api/chat`** — takes `{ message }`, calls Claude with the routing system prompt, returns `{ chart, title }`.

API key priority: `req.headers['x-api-key']` (user-pasted) → `process.env.ANTHROPIC_API_KEY` (.env).

Claude is instructed to respond with only `{ "chart": "<id>", "title": "<description>" }`. `max_tokens: 100` keeps costs minimal.

### `public/data.js`

Two functions:

**`parseCurrency(str)`** — normalizes all currency formats found in the CSV to a float in billions:
- `$3T` → `3000`, `$270B` → `270`, `$400M` → `0.4`
- `$27.7B (Salesforce)` → `27.7` (acquirer notes stripped)
- `N/A` or blank → `null`

**`loadData(callback)`** — fetches `/companies.csv` via PapaParse (`download: true, header: true`), normalizes each row, calls `callback(rows)`. Each row gets three computed fields added:
- `arr_b` — ARR in billions (null if unparseable)
- `valuation_b` — Valuation in billions (null if unparseable)
- `founded_year` — integer (null if unparseable)

Rows with bad values are **not dropped** — callers filter as needed per chart.

### `public/main.js`

**Data:** `withData(callback)` ensures the CSV is loaded only once. On `DOMContentLoaded`, data is pre-fetched in the background so the first chart renders without waiting.

**API key:** On load, checks `/api/key-status`. If no key, shows input + Test button. Test button hits `/api/test-key` — green dot on success, red on failure.

**Chat flow:** User submits prompt → POST `/api/chat` → parse `{ chart, title }` → if unknown chart, show title as text → otherwise call `appendChart()`.

**Chart rendering:** Each chart response creates a fresh `<canvas>` with a unique ID (`chart-1`, `chart-2`, …). Chart.js binds to a canvas permanently — reusing canvases causes ghost artifacts. `withData()` ensures the CSV is ready before the init function is called.

**`CHARTS` map:**
```javascript
const CHARTS = {
  pie:           { init: (id, data) => initIndustryPie(id, data) },
  scatter:       { init: (id, data) => initFoundedValuationScatter(id, data) },
  investors:     { init: (id, data) => initInvestorBar(id, data) },
  'arr-scatter': { init: (id, data) => initArrValuationScatter(id, data) },
};
```
Adding a new chart = new entry here + new file in `public/charts/`.

### `public/charts/*.js`

Each chart function signature: `initXxx(canvasId, data)` — receives the full normalized row array, filters/transforms what it needs, returns a Chart.js instance.

| File | Data used | Key logic |
|---|---|---|
| `industryPie.js` | `Industry` column | Buckets into top 5 + Other; computes counts dynamically |
| `foundedValuationScatter.js` | `founded_year`, `valuation_b` | Filters `valuation_b > 0`; deterministic x-jitter via char sum |
| `investorBar.js` | `Top Investors` column | Splits comma-separated investors, counts frequency, top 15 |
| `arrValuationScatter.js` | `arr_b`, `valuation_b` | Filters both > 0; both axes logarithmic; reference lines at 5x, 10x, 20x, 50x multiples with enhanced labeling |

---

### `public/data-verification.js`

Comprehensive data verification tools for validating CSV parsing and chart data integrity:
- **Parser sanity checks** - Verifies key companies have proper data
- **Per-chart spot checks** - Validates data requirements for each chart type
- **Currency parser validation** - Tests edge cases in currency parsing
- **Automated testing** - Can be run via browser console

---

## Data Verification

The project includes comprehensive data verification to ensure CSV parsing and chart data integrity:

- **VERIFICATION_REPORT.md** - Results of all verification checks
- **data-verification.js** - Browser-based verification tools
- **check_data_correctness.md** - Detailed verification requirements

All verification checks pass, confirming data quality and parsing accuracy.

---

## Key Decisions

| Decision | Reason |
|---|---|
| CSV loaded once, passed as argument | No per-chart fetching; all charts share the same parsed data |
| `parseCurrency` strips acquirer notes | Raw CSV contains values like `$27.7B (Salesforce)` — notes are metadata, not part of the number |
| Rows flagged but not dropped in loader | Each chart has different validity requirements; filtering at the chart level is more explicit |
| LLM call server-side only | Anthropic API blocks browser requests via CORS |
| Fresh canvas per chat response | Chart.js permanently binds to a canvas element |
| `max_tokens: 100` on routing call | Response is always a small JSON object |
