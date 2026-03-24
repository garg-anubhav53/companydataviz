function initArrValuationScatter(canvasId, data) {
  const DATA = data
    .filter(row => row.arr_b > 0 && row.valuation_b > 0)
    .map(row => ({
      x:     row.arr_b,
      y:     row.valuation_b,
      label: row['Company Name'],
    }))
    .sort((a, b) => b.y - a.y);

  // Revenue multiple reference lines — the key analytical signal on this chart
  const MULTIPLES = [5, 10, 20, 50];
  const X_MIN = 0.1, X_MAX = 1000, Y_MIN = 1, Y_MAX = 10000;

  function multipleLinePoints(k) {
    const x0 = Math.max(X_MIN, Y_MIN / k);
    const x1 = Math.min(X_MAX, Y_MAX / k);
    return [{ x: x0, y: k * x0 }, { x: x1, y: k * x1 }];
  }

  // Enhanced reference line datasets with better visual hierarchy
  const multipleDatasets = MULTIPLES.map((k, index) => {
    // Create visual hierarchy: 10x and 20x are most important, make them more prominent
    const isImportant = k === 10 || k === 20;
    const opacity = isImportant ? 0.35 : 0.18;
    const dashPattern = isImportant ? [6, 3] : [4, 4];
    const lineWidth = isImportant ? 1.5 : 1;
    
    return {
      label: `_multiple_${k}x`,
      data: multipleLinePoints(k),
      showLine: true,
      borderColor: `rgba(0,0,0,${opacity})`,
      borderWidth: lineWidth,
      borderDash: dashPattern,
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

      // All labels anchored at X_LABEL=$100B. At that x, every line's y is within bounds:
      // 5x→$500B, 10x→$1T, 20x→$2T, 50x→$5T. Vertical separation between adjacent labels
      // = log10(ratio) × chartHeight/4 ≥ log10(2) × H/4. At any chart height > 130px this
      // exceeds a 10px label, guaranteeing no overlap — no clamping or branching needed.
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

  return new Chart(document.getElementById(canvasId), {
    type: 'scatter',
    data: {
      datasets: [
        ...multipleDatasets,
        {
          label: 'SaaS Companies',
          data: DATA,
          backgroundColor: 'rgba(89, 161, 79, 0.65)',
          borderColor:     'rgba(89, 161, 79, 0.9)',
          borderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 7,
        },
      ],
    },
    plugins: [annotationPlugin],
    options: {
      responsive: true,
      animation: false,
      interaction: {
        intersect: false,
        mode: 'point',
      },
      plugins: {
        title: {
          display: true,
          text: 'ARR vs. Valuation — Top 100 SaaS Companies',
          font: { size: 15, weight: 'bold' },
          padding: { bottom: 16 },
        },
        legend: { display: false },
        tooltip: {
          filter: item => item.dataset.label === 'SaaS Companies',
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(89, 161, 79, 0.5)',
          borderWidth: 1,
          padding: 8,
          displayColors: false,
          callbacks: {
            label(ctx) {
              const { label, x, y } = ctx.raw;
              const arr = x < 1    ? `$${(x * 1000).toFixed(0)}M`
                        : x < 1000 ? `$${x}B`
                        :             `$${(x / 1000).toFixed(1)}T`;
              const val = y >= 1000 ? `$${(y / 1000).toFixed(1)}T` : `$${y}B`;
              const multiple = (y / x).toFixed(1);
              return [
                `${label}`,
                `ARR: ${arr} | Val: ${val}`,
                `Multiple: ${multiple}x`
              ];
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
            font: { size: 12, weight: '500' }
          },
          ticks: { 
            callback: tickLabel,
            font: { size: 11 }
          },
          grid: { display: false },
        },
        y: {
          type: 'logarithmic',
          min: Y_MIN,
          max: Y_MAX,
          title: { 
            display: true, 
            text: 'Valuation (USD Billions)',
            font: { size: 12, weight: '500' }
          },
          ticks: { 
            callback: tickLabel,
            font: { size: 11 }
          },
          grid: { display: false },
        },
      },
    },
  });
}
