# Spec: LLM Chat Routing via Node Server (Iteration 4)

## What We're Adding

A minimal Node/Express server that:
1. Serves the static frontend files
2. Reads an Anthropic API key from `.env`
3. Exposes a single POST endpoint `/api/chat` that takes a user prompt, sends it to Claude, and returns which chart to display

The frontend gets a chat UI that renders the appropriate hardcoded chart based on the LLM's response. **No dynamic data yet — all three charts stay hardcoded.**

## Server: `server.js`

```
express          — serve static files + one API route
dotenv           — read .env
node-fetch       — call Anthropic API (or use built-in fetch if Node 18+)
```

### Setup
```bash
npm init -y
npm install express dotenv
```

### `.env`
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Server (~30 lines)

- `express.static('public/')` — serves index.html and all JS files from a `public/` folder
- Single route: `POST /api/chat`
  - Reads `req.body.message` (the user's prompt)
  - Calls Anthropic Messages API with a system prompt (below) and the user message
  - Returns the JSON response to the frontend

### System Prompt for Claude

```
You are a chart routing assistant. The user will ask to visualize data about the top 100 SaaS companies.

You must respond with ONLY a JSON object, no other text. The JSON must have this shape:
{"chart": "<chart_id>", "title": "<short description of what you're showing>"}

The available chart_ids are:
- "pie" — industry breakdown (pie chart of company count by industry)
- "scatter" — founded year vs valuation (scatter plot, log scale Y axis)
- "investors" — most frequent investors (horizontal bar chart of investor frequency)

Pick the chart_id that best matches the user's request. If the request doesn't match any chart, respond with:
{"chart": "none", "title": "I can show you: industry breakdown, founded year vs valuation, or top investors."}
```

### API Call Shape

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: req.body.message }]
  })
});
```

Note: `max_tokens: 100` — the response is a tiny JSON object, keep it capped tight.

## Frontend Changes

### New structure
```
project/
├── server.js
├── .env
├── package.json
└── public/
    ├── index.html
    ├── main.js
    └── charts/
        ├── industryPie.js
        ├── foundedValuationScatter.js
        └── investorBar.js
```

Move all existing frontend files into `public/`.

### Chat UI (replace tab UI in index.html)

- Top bar: API key status indicator (green dot if `.env` key loaded, or an input field if not)
- Scrollable `<div id="chat-messages">` area
- Fixed bottom: `<input id="chat-input">` + send button

### Chat Flow in `main.js`

1. User types prompt, hits send
2. Show user message in chat area
3. POST to `/api/chat` with `{ message: prompt }`
4. Parse response JSON — extract `chart` and `title`
5. If `chart === "none"`: show `title` as assistant text message
6. If valid chart_id: create a new `<canvas>` in the chat area, call the matching init function (`initIndustryPie`, `initFoundedValuationScatter`, `initInvestorBar`), show `title` as a caption above it

### API Key Fallback (for submission)

On page load, check `GET /api/key-status` (returns `{"hasKey": true/false}`). If false, show an input field where the evaluator pastes their key. Send it as a header on subsequent `/api/chat` calls:
```
headers: { 'x-api-key': userProvidedKey }
```
The server uses `req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY`.

## Mistakes to Avoid

- **Do NOT call the Anthropic API from the browser.** CORS will block it. All API calls go through the Node server.
- **Parse Claude's response carefully.** Extract the text content from `response.content[0].text`, then `JSON.parse()` it. Wrap in try/catch — if Claude returns malformed JSON, show a graceful error in chat.
- **Each new chart needs its own canvas element.** Do not reuse a single canvas — Chart.js binds to a canvas once. Create a fresh `<canvas>` for each chat response and append it to the messages area.
- **Destroy isn't enough.** If you try to reuse canvases with `chart.destroy()`, you'll get ghost rendering artifacts. Fresh canvas each time.

## Success Criteria

1. `npm start` runs the server
2. Open `localhost:3000`
3. Type "show me the industry breakdown" → pie chart appears in chat
4. Type "which investors show up the most" → horizontal bar chart appears
5. Type "how old are these companies vs their valuations" → scatter plot appears
6. Type "show me employee count" → text response saying what's available