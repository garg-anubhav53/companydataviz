function initFoundedValuationScatter(canvasId, data) {
  function charSum(str) {
    return str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  }

  // Filter to rows with valid founded year and valuation; apply deterministic jitter
  const DATA = data
    .filter(row => row.founded_year && row.valuation_b > 0)
    .map(row => ({
      x:     row.founded_year + (charSum(row['Company Name']) % 7 - 3) * 0.1,
      y:     row.valuation_b,
      label: row['Company Name'],
      year:  row.founded_year,
    }));

  const LOG_TICKS = [1, 10, 100, 1000, 10000];

  return new Chart(document.getElementById(canvasId), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'SaaS Companies',
        data: DATA,
        backgroundColor: 'rgba(54, 162, 235, 0.65)',
        borderColor: 'rgba(54, 162, 235, 0.9)',
        borderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        title: {
          display: true,
          text: 'Founded Year vs. Valuation — Top 100 SaaS Companies',
          font: { size: 15, weight: 'bold' },
          padding: { bottom: 16 },
        },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const { label, y, year } = ctx.raw;
              const val = y >= 1000 ? `$${(y / 1000).toFixed(1)}T` : `$${y}B`;
              return `${label} — ${val} (founded ${year})`;
            },
          },
        },
      },
      scales: {
        x: {
          min: 1969,
          max: 2021,
          title: { display: true, text: 'Founded Year' },
          ticks: {
            stepSize: 5,
            callback: value => (Number.isInteger(value) && value % 5 === 0 ? value : ''),
          },
          grid: { display: false },
        },
        y: {
          type: 'logarithmic',
          min: 1,
          max: 10000,
          title: { display: true, text: 'Valuation (USD Billions)' },
          ticks: {
            callback(value) {
              const match = LOG_TICKS.find(t => Math.abs(value - t) / t < 0.01);
              if (!match) return '';
              return match >= 1000 ? `$${match / 1000}T` : `$${match}B`;
            },
          },
          grid: { display: false },
        },
      },
    },
  });
}
