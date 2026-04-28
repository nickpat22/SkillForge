import { chartInstances } from '../../core/state.js';

const CHART_DEFAULTS = {
  font: { family: "'Plus Jakarta Sans', 'Inter', sans-serif", size: 11 },
  tooltip: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    titleColor: '#f1f5f9',
    bodyColor: '#94a3b8',
    borderColor: 'rgba(129,140,248,0.2)',
    borderWidth: 1,
    padding: 14,
    cornerRadius: 10,
    titleFont: { family: "'Plus Jakarta Sans',sans-serif", weight: '700', size: 13 },
    bodyFont: { family: "'Inter',sans-serif", size: 12 }
  },
  gridColor: 'rgba(255,255,255,0.05)',
  labelColor: '#64748b'
};

export function destroyChart(id) {
  if (chartInstances[id]) { try { chartInstances[id].destroy(); } catch(e){} delete chartInstances[id]; }
}

export function makeBarChart(canvasId, labels, data, color, label = 'Sessions') {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: (ctx2) => {
          const chart = ctx2.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return color + 'CC';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, color + 'FF');
          g.addColorStop(1, color + '55');
          return g;
        },
        borderColor: color,
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: color + 'FF',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: CHART_DEFAULTS.tooltip
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: CHART_DEFAULTS.labelColor, font: CHART_DEFAULTS.font }
        },
        y: {
          grid: { color: CHART_DEFAULTS.gridColor, lineWidth: 1 },
          border: { display: false },
          ticks: { color: CHART_DEFAULTS.labelColor, font: CHART_DEFAULTS.font },
          beginAtZero: true
        }
      }
    }
  });
}

export function makeLineChart(canvasId, labels, data, color = '#818cf8', label = 'Score') {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        borderWidth: 2.5,
        tension: 0.45,
        fill: true,
        backgroundColor: (ctx2) => {
          const chart = ctx2.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'transparent';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, color + '40');
          g.addColorStop(1, color + '00');
          return g;
        },
        pointBackgroundColor: color,
        pointBorderColor: 'rgba(15,23,42,0.9)',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: CHART_DEFAULTS.tooltip
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: CHART_DEFAULTS.labelColor, font: CHART_DEFAULTS.font }
        },
        y: {
          grid: { color: CHART_DEFAULTS.gridColor },
          border: { display: false },
          ticks: { color: CHART_DEFAULTS.labelColor, font: CHART_DEFAULTS.font },
          beginAtZero: true
        }
      }
    }
  });
}