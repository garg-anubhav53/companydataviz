// Maps each tab name to its chart initializer.
// To add a new tab: add one entry here (and the corresponding HTML panel).
const CHART_INIT = {
  pie:     () => initIndustryPie('pie-canvas'),
  scatter: () => initFoundedValuationScatter('scatter-canvas'),
};

// Holds live Chart.js instances so each chart is only created once.
const chartInstances = {};

function showTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.dataset.tab !== tabName);
  });

  // Initialize lazily — charts must render into a visible canvas to size correctly.
  if (!chartInstances[tabName] && CHART_INIT[tabName]) {
    chartInstances[tabName] = CHART_INIT[tabName]();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  showTab('pie');
});
