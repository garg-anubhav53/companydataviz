function initIndustryPie(canvasId) {
  const industryData = {
    labels: ["Work Management", "Enterprise Software", "Database", "Communications", "Payments", "Other"],
    values: [3, 2, 2, 2, 2, 89],
    colors: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#b0b0b0']
  };

  return new Chart(document.getElementById(canvasId), {
    type: 'pie',
    data: {
      labels: industryData.labels,
      datasets: [{
        data: industryData.values,
        backgroundColor: industryData.colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Industry Breakdown — Top 100 SaaS Companies',
          font: { size: 16 }
        },
        legend: { position: 'right' }
      }
    }
  });
}
