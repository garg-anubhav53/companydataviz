# Spec: Horizontal Bar Chart — Most Frequent Investors (Iteration 3)

## Context

We're testing whether a horizontal bar chart can serve as the visualization for "which investors appear most frequently" — a prompt that asks for a table. The goal is to evaluate whether this approach works visually before committing to it in the full pipeline.

## What to Build

A single `investors.html` file. Same pattern as prior iterations: Chart.js CDN, one canvas, one script block, hardcoded data.

## Hardcoded Data (top 15 investors by frequency)

```javascript
const LABELS = [
  "Sequoia", "Accel", "Bessemer", "Andreessen Horowitz", "NEA",
  "Benchmark", "ICONIQ", "Greylock", "IVP", "Lightspeed",
  "Kleiner Perkins", "Founders Fund", "Tiger Global", "Insight", "General Catalyst"
];

const COUNTS = [18, 13, 11, 10, 8, 7, 6, 6, 6, 6, 5, 5, 5, 4, 3];

// For tooltips — which companies each investor backed
const COMPANIES = [
  "Snowflake, Notion, MongoDB, Stripe, Square, Canva, Dropbox, UiPath, Confluent, Amplitude, Mixpanel, Palo Alto Networks, RingCentral, Qualtrics, Gong, Verkada, Netskope, ServiceTitan",
  "DocuSign, Slack, Dropbox, Freshworks, Klaviyo, UiPath, Miro, Segment, Sumo Logic, CrowdStrike, Qualtrics, Algolia, Snyk",
  "Shopify, Twilio, Canva, Box, PagerDuty, SendGrid, Intercom, Auth0, Wix, LaunchDarkly, Procore",
  "Slack, Okta, Stripe, Databricks, PagerDuty, Mixpanel, Carta, Navan, Samsara, Tanium",
  "Workday, MongoDB, Box, Databricks, Elastic, Cloudflare, Braze, Plaid",
  "Asana, Airtable, Zendesk, Confluent, Elastic, New Relic, Wix",
  "Snowflake, Datadog, GitLab, Miro, Calendly, Marqeta",
  "Okta, Figma, Sumo Logic, Palo Alto Networks, Rubrik, AppDynamics",
  "UiPath, HashiCorp, Grammarly, Amplitude, Tanium, CircleCI",
  "Zscaler, Carta, Affirm, Netskope, Rubrik, AppDynamics",
  "Intuit, DocuSign, Intercom, Segment, Looker",
  "Palantir, Asana, Rippling, Affirm, Ramp",
  "Toast, Redis, Snyk, ServiceTitan, Procore",
  "Monday.com, Qualtrics, OneTrust, Automattic",
  "HubSpot, Grammarly, Gusto"
];
```

## Chart.js Constructor

```javascript
new Chart(document.getElementById('chart'), {
  type: 'bar',
  data: {
    labels: LABELS,
    datasets: [{
      label: 'Number of Portfolio Companies (Top 100 SaaS)',
      data: COUNTS,
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Most Frequent Investors Across Top 100 SaaS Companies'
      },
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: function(tooltipItems) {
            const idx = tooltipItems[0].dataIndex;
            return 'Companies: ' + COMPANIES[idx];
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Number of Companies' },
        beginAtZero: true,
        ticks: { stepSize: 2 }
      }
    }
  }
});
```

## Key Detail: `indexAxis: 'y'`

This single property flips a vertical bar chart into a horizontal one. Investor names appear on the Y-axis (left side), bars extend right by count. This is the standard Chart.js v4 approach — do NOT use `type: 'horizontalBar'` (that was Chart.js v2 and is removed in v4).

## Container Sizing

The chart has 15 rows. Give the wrapper div a `min-height: 500px` so the bars aren't compressed. A `max-width: 900px` keeps it from stretching too wide.

## Success Criteria

Open `investors.html`. You see 15 horizontal bars, sorted with Sequoia (18) at top, General Catalyst (3) at bottom. Investor names are fully readable on the left. Hovering any bar shows the count AND the list of companies that investor backed. X-axis starts at 0 and labels every 2.