## ARR vs. Valuation Enhancements — Coding Assistant Handoff

### Priority: Do not modify any existing axis, scale, or data logic. All changes are additive only.

---

### 1. Best-fit regression line

Add as a second dataset inside the existing `arrValuationScatter.js` — no new plugins or dependencies.

**Compute in log space** (required for a log-log chart):
```javascript
const logPoints = validData.map(d => ({ x: Math.log10(d.x), y: Math.log10(d.y) }));
const n = logPoints.length;
const sumX = logPoints.reduce((a, b) => a + b.x, 0);
const sumY = logPoints.reduce((a, b) => a + b.y, 0);
const sumXY = logPoints.reduce((a, b) => a + b.x * b.y, 0);
const sumX2 = logPoints.reduce((a, b) => a + b.x * b.x, 0);
const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
const intercept = (sumY - slope * sumX) / n;
```

**Generate line points** spanning the x-axis range:
```javascript
const xMin = Math.min(...validData.map(d => d.x));
const xMax = Math.max(...validData.map(d => d.x));
const regressionData = [xMin, xMax].map(x => ({
  x,
  y: Math.pow(10, slope * Math.log10(x) + intercept)
}));
```

**Add as second dataset:**
```javascript
{
  type: 'line',
  label: 'Best Fit',
  data: regressionData,
  borderColor: 'rgba(255, 99, 132, 0.7)',
  borderWidth: 2,
  pointRadius: 0,
  fill: false
}
```

---

### 2. Industry color-coding

**First — log distinct values from the CSV before writing any color map:**
```javascript
console.log([...new Set(rows.map(r => r.Industry))]);
```
Paste the output here before proceeding. Build the color map only from values that actually appear.

**Once values are confirmed**, add a color map object at the top of `arrValuationScatter.js`:
```javascript
const INDUSTRY_COLORS = {
  'Security': '#E63946',
  'Fintech': '#2A9D8F',
  // add one entry per distinct value from the log output
  'Other': '#aaaaaa' // fallback for any unmapped value
};
```

**Update the scatter dataset** to use per-point colors:
```javascript
backgroundColor: validData.map(d => INDUSTRY_COLORS[d.industry] || INDUSTRY_COLORS['Other'])
```

**Update the tooltip** to include industry:
```javascript
label: ctx => `${ctx.raw.label} (${ctx.raw.industry}): ARR $${ctx.raw.x}B, Val $${ctx.raw.y}B`
```

---

### Verification after implementing
- Regression line spans full x-axis range and sits within the point cloud (not wildly off)
- No company dots change position — only their color changes
- Any company with an unmapped industry gets `#aaaaaa`, not an error
- Screenshot and confirm both additions render without disturbing existing axes or points