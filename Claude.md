# CLAUDE.md — companydataviz

> **Cost discipline:** Read this file fully before touching any other file.
> The mental model and reference tables below should eliminate the need to open
> files speculatively. Only open a file when you are about to edit it or when a
> specific runtime value not listed here is required.

---

## Mental model

User types prompt → Express (`server.js`) sends it to Claude with `SYSTEM_PROMPT`
→ Claude returns `{ "chart": "<id>", "title": "..." }` (or lookup JSON) → `main.js` creates a
fresh `<canvas>`, looks up the chart in `CHARTS`, calls the matching init
function with the already-loaded CSV rows. For lookup requests, calls `resolveLookup()`.

**The CSV is loaded once.** `data.js::loadData` fetches `companies.csv`,
normalises every row, adds three computed fields. `main.js::withData` memoizes
the result; the callback fires synchronously on subsequent calls. It is safe to call `withData` multiple times.

**Chart.js binds permanently to a canvas.** Never reuse a canvas element.
`main.js` auto-increments a counter (`chart-1`, `chart-2`, …).

**Lookup requests return text, not charts.** When `chart: "lookup"`, the system
calls `resolveLookup(company, field, data)` and returns a formatted string
instead of creating a canvas.

---

## Authoritative file map

| File | Responsibility | Open only when… |
|---|---|---|
| `server.js` | Express routes, API key priority, `SYSTEM_PROMPT` | Editing a route or the routing prompt |
| `public/data.js` | `parseCurrency(str)`, `loadData(cb)` | Editing currency parsing or CSV loading |
| `public/main.js` | `withData()`, API key UI, chat submit, `appendChart()`, `CHARTS` map, `resolveLookup()` | Editing chat flow, lookup logic, or registering a new chart |
| `public/charts/*.js` | One file per chart, `initXxx(canvasId, data)` | Only the specific file being changed |
| `public/index.html` | Static shell, `<script>` tags | Adding a new chart file reference |
| `public/companies.csv` | Source data | **Never open — all column info is in this file** |
| `public/data-verification.js` | Data validation tools | Running verification checks |

---

## CSV columns — complete reference

### Raw columns (as they appear in the header row)

```
Company Name, Founded Year, HQ, Industry, Total Funding,
ARR, Valuation, Employees, Top Investors, Product, G2 Rating
```

### Computed fields added by `loadData` (use these in chart code)

| Computed field | Source column | Type | Transformation |
|---|---|---|---|
| `founded_year` | `Founded Year` | int \| null | `parseInt`; null if unparseable |
| `arr_b` | `ARR` | float \| null | `parseCurrency` → billions |
| `valuation_b` | `Valuation` | float \| null | `parseCurrency` → billions |

All other raw columns are available as-is on each row object under their exact
header string (e.g. `row['Company Name']`, `row['Top Investors']`).

### `parseCurrency` format table

| Input | Output |
|---|---|
| `$3T` | `3000` |
| `$270B` | `270` |
| `$400M` | `0.4` |
| `$27.7B (Salesforce)` | `27.7` (acquirer note stripped) |
| `N/A` or blank | `null` |

---

## Color palette (de facto — no shared module exists)

There is no formal shared color file. These are the colors actually in use;
follow them when adding charts to avoid visual drift.

```js
// Pie slices (top 5 industries + Other)
const PIE_COLORS = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#b0b0b0'];

// Single-series scatter / bar (blue family) — default for new charts
const BLUE_FILL   = 'rgba(54, 162, 235, 0.65)';
const BLUE_BORDER = 'rgba(54, 162, 235, 0.9)';

// ARR-scatter uses green (semantic: growth metric)
const GREEN_FILL   = 'rgba(89, 161, 79, 0.65)';
const GREEN_BORDER = 'rgba(89, 161, 79, 0.9)';
```

For a new chart: use `BLUE_FILL`/`BLUE_BORDER` as the default. Use a distinct
hue only if the chart has semantic color grouping (like the pie).

---

## Routing system prompt — exact structure

The string lives as `SYSTEM_PROMPT` in `server.js`. Its structure:

```
You are a chart routing assistant. The user will ask to visualize data
about the top 100 SaaS companies.

You must respond with ONLY a JSON object, no other text. The JSON must
have this shape:
{"chart": "<chart_id>", "title": "<short description of what you're showing>"}

The available chart_ids are:
- "<id>" — <description>
- ...
- "lookup" — Return company-specific data: {"chart": "lookup", "company": "<name>", "field": "<field>"}

Pick the chart_id that best matches the user's request. If the request
doesn't match any chart, respond with:
{"chart": "none", "title": "I can show you: ..."}
```

**When adding a chart:** add exactly one bullet to the `chart_ids` list and
update the `"none"` fallback sentence to mention the new chart. Touch nothing
else in the prompt. Keep `max_tokens: 100`.

**Lookup requests:** Use `{"chart": "lookup", "company": "<name>", "field": "<field>"}`.
No `title` field. Valid fields: `valuation`, `arr`, `investors`, `industry`, `hq`, 
`employees`, `funding`, `founded`, `product`, `g2_rating`.

---

## Current chart registry

| chart_id | File | Type | Key columns used |
|---|---|---|---|
| `pie` | `industryPie.js` | Pie | `Industry` → top 5 + Other |
| `scatter` | `foundedValuationScatter.js` | Scatter (log Y) | `founded_year` × `valuation_b` |
| `investors` | `investorBar.js` | Horizontal bar | `Top Investors` → top 15 by count |
| `arr-scatter` | `arrValuationScatter.js` | Scatter (log/log) | `arr_b` × `valuation_b` |
| `lookup` | *(no chart file)* | Text reply | Any column; `resolveLookup()` in `main.js` |

**lookup JSON shape** (differs from chart shape — no `title` field):
`{"chart": "lookup", "company": "<name>", "field": "<field>"}`
Valid fields: `valuation`, `arr`, `investors`, `industry`, `hq`, `employees`, `funding`, `founded`, `product`, `g2_rating`
Company match: exact case-insensitive → substring fallback.

**Untapped columns available for future charts:**
`HQ`, `Employees`, `Total Funding` (parseable via `parseCurrency`),
`G2 Rating`, `Product`, `Company Name` (label use only).

---

## Task recipes

### Add a new lookup field

Edit `resolveLookup()` in `public/main.js`:
1. Add the new field to the `switch` statement
2. Use `fmtB()` helper for currency fields, direct string for others
3. Handle null/undefined cases with fallback text

Example:
```js
case 'new_field': return `${name} new field: ${row['Column Name'] || 'not available'}`;
```

### Modify lookup behavior

Edit only `resolveLookup()` in `public/main.js`. The function handles:
- Company matching (exact → substring fallback)
- Field formatting (currency via `fmtB()`, text via direct access)
- Error cases (no company found, unknown field)

---

### Add a new chart (5 steps, touch only these things)

1. Create `public/charts/myChart.js`:
   ```js
   function initMyChart(canvasId, data) {
     const rows = data.filter(r => /* validity check */);
     // build Chart.js config
     return new Chart(document.getElementById(canvasId), config);
   }
   ```
   - Filter inside the function; never mutate `data`.
   - Return the Chart.js instance.

2. Add one entry to `CHARTS` in `public/main.js`:
   ```js
   'my-chart': { init: (id, data) => initMyChart(id, data) },
   ```

3. Add one `<script>` tag to `public/index.html` (before `main.js`):
   ```html
   <script src="charts/myChart.js"></script>
   ```

4. Add one bullet to `SYSTEM_PROMPT` in `server.js` and update the
   `"none"` fallback sentence.

5. Update the **Current chart registry** table in this file.

### Modify an existing chart

Open only the relevant `public/charts/*.js` file. Data contract is fixed:
full normalised row array in, Chart.js instance out. Do not touch `data.js`
or `main.js`.

### Add or edit an Express route

Edit `server.js` only. API key priority (header → `.env`) is handled by the
helper already there — do not re-implement it.

### Change currency parsing

Edit only `parseCurrency` in `public/data.js`. Add an inline comment with an
input→output example for any new format.

### Add error handling (currently none exists)

The app has no error handling. If adding it, the minimal pattern is:
- Failed `/api/chat` → append a text bubble to the chat thread (do not alert).
- Failed CSV load → show a static message in the chat area on `DOMContentLoaded`.
- Bad `chart` value from API → already handled: `main.js` shows `title` as
  plain text when `chart_id` is unknown or `"none"`.

Do not add `try/catch` inside chart init functions — bad data rows are filtered
out before the chart receives them.

---

## Hard constraints

| Constraint | Why |
|---|---|
| `max_tokens: 100` on routing call | Response is always a small JSON object |
| Fresh `<canvas>` per response | Chart.js permanently binds; reuse causes ghost artifacts |
| Filter at chart level, not in loader | Each chart has different validity requirements |
| LLM call server-side only | Anthropic API rejects browser-origin requests (CORS) |
| Never read `companies.csv` | All column info is in this file |
| Do not create a shared color module | Adds a dependency with no current benefit; copy the constants from this file instead |
| Lookup requests bypass canvas creation | `resolveLookup()` returns formatted text, not Chart.js instances |
| Company matching uses exact → substring fallback | Provides flexibility while maintaining accuracy |

---

## Response discipline

- **Do not explain what you are about to do.** Show the diff/code, then a
  one-line summary of what changed.
- **Do not run `npm install`** unless `package.json` changed.
- **Do not start the dev server** unless explicitly asked.
- **Do not write tests** unless explicitly asked.
- **Do not open a file** if the answer is already in this document.
- Emit all edits for a task in a single response; do not checkpoint between files.
- If a task is ambiguous, state your interpretation and proceed. Ask only if two
  interpretations would produce meaningfully different code.

---

## Environment

```
Node.js + Express     server.js  (npm start → node server.js → :3000)
Anthropic SDK         called only from server.js
Chart.js 4.4.7        CDN, browser only
PapaParse 5           CDN, browser only
.env                  ANTHROPIC_API_KEY  (.env.example is the template)
```