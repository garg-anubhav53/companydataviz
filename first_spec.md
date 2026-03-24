# Spec: Pie Chart — Industry Breakdown (Iteration 1)

## Context

We're building a chat-based data visualization tool for a takehome exercise. The end product will let a user type natural-language prompts and get charts back from a SaaS company dataset.

**This iteration is ONLY about rendering a single working pie chart with hardcoded data.** No server, no LLM, no CSV parsing. One HTML file that opens in a browser and displays a correct pie chart. We'll layer in data loading and LLM interpretation later.

## What to Build

A single `index.html` file containing:

1. A Chart.js CDN import
2. A `<canvas>` element
3. A `<script>` block that creates a pie chart with hardcoded data

That's it. Nothing else.

## Chart.js CDN

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
```

## Hardcoded Data

The dataset has 100 SaaS companies across 85 unique industries — extremely flat distribution. The top 5 industries have only 2–3 companies each. Use these exact values:

```
Labels: ["Work Management", "Enterprise Software", "Database", "Communications", "Payments", "Other"]
Values: [3, 2, 2, 2, 2, 89]
```

## Chart.js Constructor

```javascript
new Chart(document.getElementById('chart'), {
  type: 'pie',
  data: {
    labels: [...],
    datasets: [{
      data: [...],
      backgroundColor: [use 6 distinct colors]
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Industry Breakdown — Top 100 SaaS Companies' },
      legend: { position: 'right' }
    }
  }
});
```

## Common Mistakes to Avoid

- **Do NOT use `type: 'doughnut'`** — the prompt says pie chart.
- **Do NOT forget `responsive: true`** — without it the chart can render at 0 height.
- **The canvas element needs a parent container with a defined size** — either set `max-width` on a wrapper div or the chart may blow up to full viewport.
- **Do NOT add any framework, bundler, or build step.** This must be a raw HTML file that works by double-clicking to open in a browser.

## Success Criteria

Open `index.html` in a browser. You see a pie chart with 6 slices. "Other" dominates (89/100). Title and legend are visible. That's a pass.

## What Comes Next (do NOT build yet)

After this renders correctly, the next iterations will:
1. Load the actual CSV using PapaParse and compute the counts dynamically
2. Generalize the renderer to accept a JSON "chart spec" so we can support scatter, bar, and table
3. Wire in an LLM to interpret user prompts and generate chart specs