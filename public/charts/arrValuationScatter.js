function initArrValuationScatter(canvasId, data) {
  const DATA = data
    .filter(row => row.arr_b > 0 && row.valuation_b > 0)
    .map(row => ({
      x:     row.arr_b,
      y:     row.valuation_b,
      label: row['Company Name'],
    }));

  const LOG_TICKS = [0.1, 1, 10, 100, 1000];

  function tickLabel(value) {
    const match = LOG_TICKS.find(t => Math.abs(value - t) / t < 0.01);
    if (!match) return '';
    return match >= 1000 ? `$${match / 1000}T` : `$${match}B`;
  }

  return new Chart(document.getElementById(canvasId), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'SaaS Companies',
        data: DATA,
        backgroundColor: 'rgba(89, 161, 79, 0.65)',
        borderColor: 'rgba(89, 161, 79, 0.9)',
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 9,
      }],
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: 'ARR vs. Valuation — Top 100 SaaS Companies',
          font: { size: 15, weight: 'bold' },
          padding: { bottom: 16 },
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const { label, x, y } = ctx.raw;
              const arr = x >= 1000 ? `$${(x / 1000).toFixed(1)}T` : `$${x}B`;
              const val = y >= 1000 ? `$${(y / 1000).toFixed(1)}T` : `$${y}B`;
              return `${label} — ARR ${arr}, Val ${val}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'logarithmic',
          min: 0.1,
          max: 1000,
          title: { display: true, text: 'ARR (USD Billions, log scale)' },
          ticks: { callback: tickLabel },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
        y: {
          type: 'logarithmic',
          min: 1,
          max: 10000,
          title: { display: true, text: 'Valuation (USD Billions, log scale)' },
          ticks: { callback: tickLabel },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    },
  });
}
