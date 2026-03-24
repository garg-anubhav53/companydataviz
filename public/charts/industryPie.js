function initIndustryPie(canvasId, data) {
  const TOP_INDUSTRIES = ['Work Management', 'Enterprise Software', 'Database', 'Communications', 'Payments'];

  // Count companies per display bucket; anything not in top 5 goes to Other
  const counts = {};
  data.forEach(row => {
    const bucket = TOP_INDUSTRIES.includes(row['Industry']) ? row['Industry'] : 'Other';
    counts[bucket] = (counts[bucket] || 0) + 1;
  });

  const named = TOP_INDUSTRIES.filter(i => counts[i]).sort((a, b) => counts[b] - counts[a]);
  const labels = [...named, 'Other'];
  const values = labels.map(l => counts[l] || 0);
  const colors = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#b0b0b0'];

  return new Chart(document.getElementById(canvasId), {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors }],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Industry Breakdown — Top 100 SaaS Companies',
          font: { size: 16 },
        },
        legend: { position: 'right' },
      },
    },
  });
}
