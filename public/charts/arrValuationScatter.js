function initArrValuationScatter(canvasId, data) {
  // Industry colors — seeded from the 5 known categories in this dataset
  const INDUSTRY_COLORS = {
    'Work Management':    '#4e79a7',
    'Enterprise Software':'#f28e2b',
    'Database':           '#e15759',
    'Communications':     '#76b7b2',
    'Payments':           '#59a14f',
    'Other':              '#aaaaaa',
  };
  const industryColor = ind => INDUSTRY_COLORS[ind] || INDUSTRY_COLORS['Other'];

  const DATA = data
    .filter(row => row.arr_b > 0 && row.valuation_b > 0)
    .map(row => ({
      x:        row.arr_b,
      y:        row.valuation_b,
      label:    row['Company Name'],
      industry: row['Industry'],
    }))
    .sort((a, b) => b.y - a.y);

  // Log-space linear regression (required for log-log chart accuracy)
  const n    = DATA.length;
  const logX = DATA.map(d => Math.log10(d.x));
  const logY = DATA.map(d => Math.log10(d.y));
  const mX   = logX.reduce((a, b) => a + b, 0) / n;
  const mY   = logY.reduce((a, b) => a + b, 0) / n;
  const slope     = logX.reduce((s, x, i) => s + (x - mX) * (logY[i] - mY), 0)
                  / logX.reduce((s, x)    => s + (x - mX) ** 2, 0);
  const intercept = mY - slope * mX;
  const ssRes     = logY.reduce((s, y, i) => s + (y - (slope * logX[i] + intercept)) ** 2, 0);
  const ssTot     = logY.reduce((s, y)    => s + (y - mY) ** 2, 0);
  const rSquared  = 1 - ssRes / ssTot;
  const xMin = Math.min(...DATA.map(d => d.x));
  const xMax = Math.max(...DATA.map(d => d.x));
  const regressionData = [xMin, xMax].map(x => ({ x, y: Math.pow(10, slope * Math.log10(x) + intercept) }));
  // Reference points for business-friendly tooltip (computed once, used in callback)
  const ref1B  = Math.pow(10, intercept);         // implied valuation at $1B ARR (log10(1)=0)
  const ref10B = Math.pow(10, slope + intercept); // implied valuation at $10B ARR (log10(10)=1)

  // Per-industry datasets — gives Chart.js a real legend with color swatches
  const byIndustry = {};
  DATA.forEach(d => {
    const bucket = INDUSTRY_COLORS[d.industry] ? d.industry : 'Other';
    (byIndustry[bucket] = byIndustry[bucket] || []).push(d);
  });
  const industryDatasets = Object.keys(INDUSTRY_COLORS)
    .filter(ind => byIndustry[ind])
    .map(ind => ({
      label:            ind,
      data:             byIndustry[ind],
      backgroundColor:  industryColor(ind) + 'aa',
      borderColor:      industryColor(ind),
      borderWidth:      1,
      pointRadius:      4,
      pointHoverRadius: 7,
    }));

  // Revenue multiple reference lines — the key analytical signal on this chart
  const MULTIPLES = [5, 10, 20, 50];
  const X_MIN = 0.1, X_MAX = 1000, Y_MIN = 1, Y_MAX = 10000;

  function multipleLinePoints(k) {
    const x0 = Math.max(X_MIN, Y_MIN / k);
    const x1 = Math.min(X_MAX, Y_MAX / k);
    return [{ x: x0, y: k * x0 }, { x: x1, y: k * x1 }];
  }

  const multipleDatasets = MULTIPLES.map((k) => {
    const isImportant = k === 10 || k === 20;
    return {
      label: `_multiple_${k}x`,
      data: multipleLinePoints(k),
      showLine: true,
      borderColor: `rgba(0,0,0,${isImportant ? 0.35 : 0.18})`,
      borderWidth: isImportant ? 1.5 : 1,
      borderDash: isImportant ? [6, 3] : [4, 4],
      pointRadius: 0,
      pointHitRadius: 0,
      pointHoverRadius: 0,
    };
  });

  const annotationPlugin = {
    id: 'arrAnnotations',
    afterDraw(chart) {
      const { ctx, scales: { x: xScale, y: yScale } } = chart;
      ctx.save();

      // All labels anchored at X_LABEL=$100B — guaranteed non-overlapping (see comment in git history)
      const X_LABEL = 100;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const px = xScale.getPixelForValue(X_LABEL);

      MULTIPLES.forEach(k => {
        const isImportant = k === 10 || k === 20;
        ctx.font = isImportant ? 'bold 10px sans-serif' : '10px sans-serif';
        ctx.fillStyle = isImportant ? 'rgba(30,30,30,0.85)' : 'rgba(80,80,80,0.6)';
        ctx.fillText(`${k}x`, px + 5, yScale.getPixelForValue(k * X_LABEL));
      });

      ctx.restore();
    },
  };

  function tickLabel(value) {
    if (Math.abs(value - 0.1) / 0.1 < 0.01) return '$100M';
    const match = [1, 10, 100, 1000].find(t => Math.abs(value - t) / t < 0.01);
    if (!match) return '';
    return match >= 1000 ? `$${match / 1000}T` : `$${match}B`;
  }

  function fmtB(b) {
    if (b >= 1000) return `$${(b / 1000).toFixed(1)}T`;
    if (b >= 1)    return `$${b.toFixed(0)}B`;
    return `$${(b * 1000).toFixed(0)}M`;
  }

  return new Chart(document.getElementById(canvasId), {
    type: 'scatter',
    data: {
      datasets: [
        ...multipleDatasets,
        {
          type: 'line',
          label: 'Best Fit',
          data: regressionData,
          borderColor: 'rgba(255, 99, 132, 0.7)',
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 6,
          fill: false,
        },
        ...industryDatasets,
      ],
    },
    plugins: [annotationPlugin],
    options: {
      responsive: true,
      animation: false,
      interaction: { intersect: false, mode: 'nearest' },
      plugins: {
        title: {
          display: true,
          text: 'ARR vs. Valuation — Top 100 SaaS Companies',
          font: { size: 15, weight: 'bold' },
          padding: { bottom: 16 },
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            // hide multiple reference line entries; show Best Fit + industries
            filter: item => !item.text.startsWith('_multiple_'),
            boxWidth: 10,
            boxHeight: 10,
            padding: 12,
            font: { size: 11 },
          },
        },
        tooltip: {
          filter: item => !item.dataset.label.startsWith('_multiple_'),
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(89, 161, 79, 0.5)',
          borderWidth: 1,
          padding: 8,
          displayColors: false,
          callbacks: {
            title(items) {
              return items[0]?.dataset.label === 'Best Fit' ? 'Market trend' : '';
            },
            label(ctx) {
              if (ctx.dataset.label === 'Best Fit') {
                return [
                  `$1B ARR → ~${fmtB(ref1B)} valuation (~${Math.round(ref1B)}x)`,
                  `$10B ARR → ~${fmtB(ref10B)} valuation (~${Math.round(ref10B / 10)}x)`,
                ];
              }
              const { label, x, y } = ctx.raw;
              const multiple = (y / x).toFixed(1);
              return [`${label}`, `ARR: ${fmtB(x)} | Val: ${fmtB(y)}`, `Multiple: ${multiple}x`];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'logarithmic',
          min: X_MIN,
          max: X_MAX,
          title: {
            display: true,
            text: 'ARR (USD Billions)',
            font: { size: 12, weight: '500' },
          },
          ticks: { callback: tickLabel, font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          type: 'logarithmic',
          min: Y_MIN,
          max: Y_MAX,
          title: {
            display: true,
            text: 'Valuation (USD Billions)',
            font: { size: 12, weight: '500' },
          },
          ticks: { callback: tickLabel, font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}
