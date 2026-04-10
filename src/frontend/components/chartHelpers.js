import { chartInstances } from '../../core/state.js';

const CHART_DEFAULTS = {
  font: { family: "'DM Sans', sans-serif" },
  tooltip: { backgroundColor:'#0F1F4B', titleColor:'#fff', bodyColor:'#CBD5E1', padding:12, cornerRadius:8, titleFont:{family:"'DM Sans',sans-serif"}, bodyFont:{family:"'DM Sans',sans-serif"} },
  gridColor: '#F1F5F9', labelColor: '#64748B'
};

export function destroyChart(id) {
  if (chartInstances[id]) { try { chartInstances[id].destroy(); } catch(e){} delete chartInstances[id]; }
}

export function makeBarChart(canvasId, labels, data, color, label='Sessions') {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label, data, backgroundColor: color + 'CC', borderColor: color, borderWidth: 2, borderRadius: 8, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend:{display:false}, tooltip: CHART_DEFAULTS.tooltip },
      scales: {
        x: { grid:{display:false}, ticks:{color:CHART_DEFAULTS.labelColor, font:CHART_DEFAULTS.font} },
        y: { grid:{color:CHART_DEFAULTS.gridColor}, ticks:{color:CHART_DEFAULTS.labelColor, font:CHART_DEFAULTS.font}, beginAtZero:true }
      }
    }
  });
}

export function makeLineChart(canvasId, labels, data, color='#7C3AED', label='Score') {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label, data, borderColor:color, borderWidth:2, tension:0.4, fill:true, backgroundColor:'rgba(124,58,237,0.08)', pointBackgroundColor:color, pointRadius:5 }] },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend:{display:false}, tooltip: CHART_DEFAULTS.tooltip },
      scales: {
        x: { grid:{display:false}, ticks:{color:CHART_DEFAULTS.labelColor, font:CHART_DEFAULTS.font} },
        y: { grid:{color:CHART_DEFAULTS.gridColor}, ticks:{color:CHART_DEFAULTS.labelColor, font:CHART_DEFAULTS.font}, beginAtZero:true }
      }
    }
  });
}