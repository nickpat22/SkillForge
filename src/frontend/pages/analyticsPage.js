import { database } from '../../backend/db/database.js';
import { analyticsService } from '../../backend/services/analyticsService.js';
import { makeBarChart, makeLineChart } from '../components/chartHelpers.js';

export function init() {
  // Analytics page init
}

export function refreshAnalytics() {
  const sessions = database.getLocal('sessions') || [];
  const scores = database.getLocal('quiz_scores') || [];
  document.getElementById('an-best-time').textContent = analyticsService.getBestTimeSlot(sessions);
  document.getElementById('an-avg-eff').textContent = analyticsService.calculateEffectiveness(sessions) ? (analyticsService.calculateEffectiveness(sessions)*100).toFixed(2)+'%' : '—';
  document.getElementById('an-consistency').textContent = analyticsService.calculateConsistency(sessions) + '%';
  const imp = analyticsService.calculateImprovement(scores);
  const impEl = document.getElementById('an-improvement');
  impEl.textContent = (imp >= 0 ? '+' : '') + imp + '%';
  impEl.style.color = imp >= 0 ? '#10B981' : '#EF4444';
  const slotEff = analyticsService.getSlotEffectiveness(sessions);
  const weekly = analyticsService.getWeeklyActivity(sessions);
  setTimeout(() => {
    makeBarChart('an-slot-chart', Object.keys(slotEff), Object.values(slotEff).map(v => +v.toFixed(4)), '#2563EB', 'Effectiveness');
    makeBarChart('an-weekly-chart', weekly.labels, weekly.counts, '#10B981', 'Sessions');
    if (scores.length) {
      makeLineChart('an-score-chart', scores.map((_,i) => 'Quiz '+(i+1)), scores.map(s => s.pct), '#7C3AED', 'Score %');
    } else {
      makeLineChart('an-score-chart', ['No data yet'], [0]);
    }
  }, 50);
}