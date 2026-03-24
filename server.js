require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const SYSTEM_PROMPT = `You are a chart routing assistant. The user will ask to visualize data about the top 100 SaaS companies.

You must respond with ONLY a JSON object, no other text. The JSON must have this shape:
{"chart": "<chart_id>", "title": "<short description of what you're showing>"}

The available chart_ids are:
- "pie" — industry breakdown (pie chart of company count by industry)
- "scatter" — founded year vs valuation (scatter plot, log scale Y axis)
- "investors" — most frequent investors (horizontal bar chart of investor frequency)

Pick the chart_id that best matches the user's request. If the request doesn't match any chart, respond with:
{"chart": "none", "title": "I can show you: industry breakdown, founded year vs valuation, or top investors."}`;

app.get('/api/key-status', (req, res) => {
  res.json({ hasKey: !!process.env.ANTHROPIC_API_KEY });
});

// Makes a minimal real API call to verify the key is valid and has access.
app.get('/api/test-key', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ ok: false, error: 'No API key provided.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.json({ ok: false, error: data.error?.message || 'Invalid API key.' });
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: 'Could not reach Anthropic API.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'No API key provided.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 100,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: req.body.message }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error.' });
    }

    const raw = data.content[0].text;
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse response from Claude.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
