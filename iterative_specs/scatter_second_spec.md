# Spec: Scatter Plot — Founded Year vs. Valuation (Iteration 2)

## Context

We're iteratively building chart renderers for a data visualization chat tool. Iteration 1 produced a working pie chart in a single HTML file using Chart.js. This iteration adds a scatter plot.

**Structural goal:** Start extracting a `renderChart(config)` function so the chart creation logic is driven by a config object, not baked into the page. Both the pie chart and this scatter plot should be callable through the same pattern. This is prep for later iterations where an LLM will generate these config objects.

## What to Build

A single `scatter.html` file (same pattern as the pie chart file). Later we'll merge them, but for now keep them separate so we can verify this renders correctly in isolation.

### Structure

```
scatter.html
├── Chart.js CDN (same as pie chart)
├── <div> wrapper (max-width: 900px, centered)
│   └── <canvas id="chart">
└── <script>
    ├── const DATA = [ ... 88 data points ... ]
    └── new Chart(...)
```

## The Data

88 companies with valid valuations (12 had N/A and were excluded). Values are in billions USD.

```javascript
const DATA = [
  { x: 1972, y: 215.0, label: "SAP" },
  { x: 1975, y: 3000.0, label: "Microsoft" },
  { x: 1977, y: 350.0, label: "Oracle" },
  { x: 1982, y: 240.0, label: "Adobe" },
  { x: 1983, y: 180.0, label: "Intuit" },
  { x: 1999, y: 227.8, label: "Salesforce" },
  { x: 2001, y: 8.0, label: "Five9" },
  { x: 2002, y: 55.0, label: "Atlassian" },
  { x: 2002, y: 9.0, label: "Procore" },
  { x: 2003, y: 10.0, label: "DocuSign" },
  { x: 2003, y: 52.0, label: "Palantir" },
  { x: 2003, y: 5.0, label: "RingCentral" },
  { x: 2004, y: 147.0, label: "ServiceNow" },
  { x: 2004, y: 1.5, label: "Vimeo" },
  { x: 2005, y: 65.0, label: "Workday" },
  { x: 2005, y: 3.5, label: "Box" },
  { x: 2005, y: 7.0, label: "UiPath" },
  { x: 2005, y: 95.0, label: "Palo Alto Networks" },
  { x: 2005, y: 7.5, label: "Automattic" },
  { x: 2006, y: 95.0, label: "Shopify" },
  { x: 2006, y: 32.0, label: "HubSpot" },
  { x: 2006, y: 9.0, label: "Bill.com" },
  { x: 2006, y: 10.0, label: "Wix" },
  { x: 2007, y: 26.0, label: "MongoDB" },
  { x: 2007, y: 13.2, label: "Zendesk" },
  { x: 2007, y: 35.0, label: "Veeva Systems" },
  { x: 2007, y: 12.0, label: "Zoom Info" },
  { x: 2007, y: 9.5, label: "Tanium" },
  { x: 2008, y: 12.0, label: "Twilio" },
  { x: 2008, y: 5.5, label: "Asana" },
  { x: 2008, y: 8.5, label: "Dropbox" },
  { x: 2008, y: 6.5, label: "New Relic" },
  { x: 2008, y: 30.0, label: "Zscaler" },
  { x: 2008, y: 5.7, label: "JFrog" },
  { x: 2009, y: 25.0, label: "Okta" },
  { x: 2009, y: 85.0, label: "Square" },
  { x: 2009, y: 2.8, label: "PagerDuty" },
  { x: 2009, y: 28.0, label: "Cloudflare" },
  { x: 2009, y: 13.0, label: "Grammarly" },
  { x: 2009, y: 1.1, label: "Mixpanel" },
  { x: 2010, y: 44.0, label: "Datadog" },
  { x: 2010, y: 65.0, label: "Stripe" },
  { x: 2010, y: 5.2, label: "Freshworks" },
  { x: 2010, y: 2.3, label: "Sumo Logic" },
  { x: 2010, y: 4.3, label: "Marqeta" },
  { x: 2011, y: 85.0, label: "Zoom" },
  { x: 2011, y: 8.0, label: "GitLab" },
  { x: 2011, y: 17.5, label: "Miro" },
  { x: 2011, y: 1.3, label: "Intercom" },
  { x: 2011, y: 70.0, label: "CrowdStrike" },
  { x: 2011, y: 20.0, label: "Toast" },
  { x: 2011, y: 2.3, label: "Salesloft" },
  { x: 2011, y: 5.6, label: "Braze" },
  { x: 2011, y: 9.5, label: "Gusto" },
  { x: 2011, y: 13.0, label: "Celonis" },
  { x: 2011, y: 2.0, label: "Redis" },
  { x: 2011, y: 1.7, label: "CircleCI" },
  { x: 2012, y: 75.0, label: "Snowflake" },
  { x: 2012, y: 14.0, label: "Monday.com" },
  { x: 2012, y: 11.0, label: "Airtable" },
  { x: 2012, y: 9.5, label: "Klaviyo" },
  { x: 2012, y: 13.0, label: "HashiCorp" },
  { x: 2012, y: 8.0, label: "Elastic" },
  { x: 2012, y: 4.0, label: "Amplitude" },
  { x: 2012, y: 7.4, label: "Carta" },
  { x: 2012, y: 12.0, label: "Affirm" },
  { x: 2012, y: 6.1, label: "Benchling" },
  { x: 2012, y: 2.3, label: "Algolia" },
  { x: 2012, y: 7.5, label: "Netskope" },
  { x: 2012, y: 9.5, label: "ServiceTitan" },
  { x: 2013, y: 10.0, label: "Notion" },
  { x: 2013, y: 40.0, label: "Canva" },
  { x: 2013, y: 43.0, label: "Databricks" },
  { x: 2013, y: 3.0, label: "Calendly" },
  { x: 2013, y: 13.4, label: "Plaid" },
  { x: 2014, y: 9.1, label: "Confluent" },
  { x: 2014, y: 4.4, label: "Outreach" },
  { x: 2014, y: 3.0, label: "LaunchDarkly" },
  { x: 2014, y: 6.0, label: "Rubrik" },
  { x: 2015, y: 7.3, label: "Gong" },
  { x: 2015, y: 9.2, label: "Navan" },
  { x: 2015, y: 12.0, label: "Samsara" },
  { x: 2015, y: 7.4, label: "Snyk" },
  { x: 2016, y: 13.5, label: "Rippling" },
  { x: 2016, y: 3.2, label: "Verkada" },
  { x: 2016, y: 5.3, label: "OneTrust" },
  { x: 2017, y: 12.3, label: "Brex" },
  { x: 2019, y: 8.1, label: "Ramp" }
];
```

## Critical: Y-Axis MUST Be Logarithmic

The valuation data spans from $1.1B to $3,000B (3T). Distribution:
- 44 companies below $10B
- 27 companies between $10–50B
- 10 companies between $50–100B
- 7 companies above $100B

On a linear scale, 80% of the dots collapse into the bottom 3% of the chart. **Use `type: 'logarithmic'` on the Y-axis.**

## Chart.js Constructor

```javascript
new Chart(document.getElementById('chart'), {
  type: 'scatter',
  data: {
    datasets: [{
      label: 'SaaS Companies',
      data: DATA,
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
      pointRadius: 6,
      pointHoverRadius: 9
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Founded Year vs. Valuation — Top 100 SaaS Companies'
      },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const pt = ctx.raw;
            return `${pt.label}: $${pt.y}B (${pt.x})`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Founded Year' },
        ticks: { stepSize: 5 }
      },
      y: {
        type: 'logarithmic',
        title: { display: true, text: 'Valuation (USD Billions)' },
        ticks: {
          callback: function(value) {
            if ([1, 10, 100, 1000].includes(value)) return '$' + value + 'B';
            return '';
          }
        }
      }
    }
  }
});
```

## Things That Will Break If You Get Them Wrong

1. **Forgetting `type: 'logarithmic'` on the Y-axis** — chart will render but look like all dots are at y=0 with one dot at the top. This is THE most important detail.
2. **Log scale tick labels** — Chart.js generates many intermediate ticks on log scales and labels them all by default, creating visual clutter. The `ticks.callback` above filters to only show $1B, $10B, $100B, $1000B. Do not omit this.
3. **The `label` field in each data point** — Chart.js scatter expects `{x, y}` objects. Extra fields like `label` are ignored by the renderer but accessible in tooltip callbacks via `ctx.raw.label`. This is how we get company names in tooltips without breaking the chart.
4. **X-axis is NOT categorical** — do not use `labels: [...]` for the x-axis. Scatter plots in Chart.js use numeric axes. The `x` values in the data drive positioning directly.

## Emerging Pattern for Later

Notice the shape: the entire chart is defined by a config object (`type`, `data`, `options`). When we generalize, a `renderChart(canvasId, config)` function just passes this config straight to `new Chart()`. The LLM's job becomes: generate this config object. The renderer stays dumb.

## Success Criteria

Open `scatter.html` in a browser. You see a scatter plot. The Y-axis is logarithmic with tick marks at $1B, $10B, $100B, $1000B. Microsoft ($3T) is at the top. Most dots cluster in the $1–50B range between 2005–2019. Hovering on any dot shows the company name, valuation, and year. That's a pass.