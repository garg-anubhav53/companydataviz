function initInvestorBar(canvasId, data) {
  // Count how many companies each investor appears in; track company names for tooltips
  const counts = {};
  const portfolios = {};

  data.forEach(row => {
    const name = row['Company Name'];
    const investors = (row['Top Investors'] || '').split(',').map(s => s.trim()).filter(Boolean);
    investors.forEach(inv => {
      counts[inv] = (counts[inv] || 0) + 1;
      portfolios[inv] = portfolios[inv] ? portfolios[inv] + ', ' + name : name;
    });
  });

  const top15 = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const labels = top15.map(([inv]) => inv);
  const values = top15.map(([, count]) => count);

  function wrapCompanies(str, maxLen) {
    const words = str.split(', ');
    const lines = [];
    let line = '';
    for (const word of words) {
      if (line.length > 0 && (line + word).length > maxLen) {
        lines.push(line.replace(/,\s*$/, ''));
        line = '';
      }
      line += word + ', ';
    }
    if (line.length > 0) lines.push(line.replace(/,\s*$/, ''));
    return lines;
  }

  return new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Portfolio Companies',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Investor Concentration — Top 100 SaaS Companies',
          font: { size: 15, weight: 'bold' },
          padding: { bottom: 16 },
        },
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          padding: 8,
          displayColors: false,
          callbacks: {
            afterBody(tooltipItems) {
              const inv = labels[tooltipItems[0].dataIndex];
              return ['\nPortfolio:', ...wrapCompanies(portfolios[inv], 60)];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: 'Number of Companies' },
          ticks: { stepSize: 2 },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
        y: { grid: { display: false } },
      },
    },
  });
}
