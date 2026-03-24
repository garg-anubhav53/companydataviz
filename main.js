// Chart instances — kept so we can destroy/resize if needed later
const chartInstances = {};

function showTab(tabName) {
  // Update tab button states
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Show/hide panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.dataset.tab !== tabName);
  });

  // Initialize the chart the first time its tab is shown
  if (tabName === 'pie' && !chartInstances.pie) {
    chartInstances.pie = initIndustryPie('pie-canvas');
  }
  if (tabName === 'scatter' && !chartInstances.scatter) {
    chartInstances.scatter = initFoundedValuationScatter('scatter-canvas');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  // Initialize the default tab
  showTab('pie');
});
