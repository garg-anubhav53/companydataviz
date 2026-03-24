# Codebase Guide

How this project is structured and how each piece works. Updated after every meaningful change.

---

## What This Is

A chat-driven data visualization tool. Type a natural-language prompt, get a chart back. A Node/Express server proxies prompts to Claude, which returns a chart ID. The frontend renders the matching hardcoded chart in the chat thread.

**Stack:** Node.js + Express · Anthropic API (Claude) · Chart.js 4.4.7 (CDN) · Vanilla JS frontend

---

## Current State: Iteration 4

Three hardcoded charts, routed by LLM:

| chart_id    | Chart type        | Description                                  |
|-------------|-------------------|----------------------------------------------|
| `pie`       | Pie               | Industry breakdown of top 100 SaaS companies |
| `scatter`   | Scatter (log)     | Founded year vs. valuation                   |
| `investors` | Horizontal bar    | Most frequent investors by portfolio count   |

---

## File Structure

```
companydataviz/
├── server.js                        # Express server + /api/chat route
├── .env                             # ANTHROPIC_API_KEY (gitignored)
├── .env.example                     # Template for .env
├── package.json                     # npm config, "start": "node server.js"
├── public/                          # Static files served by Express
│   ├── index.html                   # Chat UI
│   ├── main.js                      # Chat logic, API calls, chart rendering
│   ├── charts/
│   │   ├── industryPie.js           # initIndustryPie(canvasId)
│   │   ├── foundedValuationScatter.js # initFoundedValuationScatter(canvasId)
│   │   └── investorBar.js           # initInvestorBar(canvasId)
│   ├── scatter.html                 # Standalone scatter (dev/testing)
│   └── investors.html               # Standalone investor bar (dev/testing)
├── iterative_specs/                 # Per-iteration build specs
├── test_outputs/                    # Screenshots for visual QA
├── data_verification.md             # SQL + expected output for each chart
├── CODEBASE.md                      # This file
└── README.md                        # Project overview
```

---

## How It Works

### Running the app

```bash
cp .env.example .env      # add your key
npm install
npm start                 # http://localhost:3000
```

### `server.js`

Two routes:

- **`GET /api/key-status`** — returns `{ hasKey: true/false }` so the frontend knows whether to show the key input field.
- **`POST /api/chat`** — takes `{ message }`, calls the Anthropic Messages API with a routing system prompt, returns `{ chart, title }`.

API key priority: `req.headers['x-api-key']` (user-pasted in UI) falls back to `process.env.ANTHROPIC_API_KEY` (`.env` file).

The system prompt instructs Claude to respond with only a JSON object: `{ "chart": "<chart_id>", "title": "<description>" }`. `max_tokens: 100` keeps the call cheap — the response is never more than one small JSON object.

Claude's raw response is in `data.content[0].text`. This is JSON-parsed and forwarded to the frontend. If parsing fails, a graceful error message is returned.

### `public/index.html`

Pure layout — chat header, scrollable message feed, fixed input bar. No logic. Loads Chart.js from CDN, then the three chart files, then `main.js`.

### `public/main.js`

Three responsibilities:

**1. API key check** (`checkKeyStatus`)
On load, hits `/api/key-status`. If no key is configured, shows a password input in the header. The user-pasted key is stored in `userApiKey` and sent as `x-api-key` on subsequent requests.

**2. Message rendering** (`appendMessage`, `appendChart`)
User messages appear as right-aligned blue bubbles. Assistant text responses appear as left-aligned white bubbles. Chart responses get a caption line (the `title` from Claude) above a fresh `<canvas>` in a white card.

Each chart gets a unique canvas ID (`chart-1`, `chart-2`, …) via `canvasCounter`. This is required because Chart.js binds permanently to a canvas element — reusing the same canvas causes ghost rendering artifacts.

**3. Send flow** (`sendMessage`)
POST to `/api/chat` → parse `{ chart, title }` → if `chart === 'none'` or unknown, show title as text → otherwise call `CHARTS[chartId].init(canvasId)`.

The `CHARTS` map connects each `chart_id` to its init function:
```javascript
const CHARTS = {
  pie:       { init: (id) => initIndustryPie(id) },
  scatter:   { init: (id) => initFoundedValuationScatter(id) },
  investors: { init: (id) => initInvestorBar(id) },
};
```
Adding a new chart = new entry here + new chart file in `public/charts/`.

### `public/charts/*.js`

Unchanged from iteration 3. Each file exposes one `initXxx(canvasId)` function that builds a Chart.js config and returns the instance. See earlier sections of this doc for per-chart details.

---

## Key Decisions

| Decision | Reason |
|---|---|
| LLM call goes through the server, never the browser | Anthropic API blocks browser requests via CORS |
| `max_tokens: 100` | Response is always a tiny JSON object — no need to pay for more |
| Fresh canvas per chat response | Chart.js binds to a canvas permanently; reusing causes ghost artifacts |
| `canvasCounter` for unique IDs | Simple, zero-dependency way to guarantee unique canvas IDs per session |
| `x-api-key` header fallback | Lets evaluators paste their own key without touching `.env` |
| `.env.example` committed, `.env` gitignored | Documents required config without exposing secrets |

---

## What Comes Next

1. Load real data from CSV using PapaParse (replace hardcoded arrays)
2. Build a `renderChart(canvasId, config)` generic renderer driven by a JSON spec
3. Have Claude generate full chart specs (data + config) rather than just routing to hardcoded charts
