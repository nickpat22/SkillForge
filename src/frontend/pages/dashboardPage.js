import { state } from '../../core/state.js';
import { database } from '../../backend/db/database.js';
import { analyticsService } from '../../backend/services/analyticsService.js';
import { makeBarChart } from '../components/chartHelpers.js';
import { renderSessionsList } from '../components/uiHelpers.js';
import { getTimeSlot, avgEffectiveness, bestTimeSlot, calcConsistency, calcStreak, getWeeklyMinutes } from '../../core/utils.js';

export function init() {
  // Dashboard page init
}

export function refreshDashboard() {
  const sessions = database.getLocal('sessions') || [];
  const scores = database.getLocal('quiz_scores') || [];
  const now = new Date();
  const h = now.getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const user = state.currentUser;
  const name = (user && user.name) ? user.name.split(' ')[0] : (typeof user === 'string' ? user : 'Student');
  const greetEl = document.getElementById('dash-greeting');
  if (greetEl) greetEl.textContent = greet + ', ' + name + '! 👋';
  const streak = calcStreak(sessions);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeekCount = sessions.filter(s => new Date(s.date) >= startOfWeek).length;
  const streakEl = document.getElementById('dash-streak-text');
  if (streakEl) streakEl.textContent = thisWeekCount + ' sessions this week · ' + streak + ' day streak 🔥';
  const eff = avgEffectiveness(sessions);
  const effEl = document.getElementById('dash-effectiveness');
  if (effEl) effEl.textContent = eff ? (eff * 100).toFixed(1) + '%' : '0%';
  const bestEl = document.getElementById('dash-best-time');
  if (bestEl) bestEl.textContent = bestTimeSlot(sessions);
  const conEl = document.getElementById('dash-consistency');
  if (conEl) conEl.textContent = calcConsistency(sessions) + '%';
  const bestScore = scores.length ? Math.max(...scores.map(s => s.pct || 0)) : 0;
  const scoreEl = document.getElementById('dash-best-score');
  if (scoreEl) scoreEl.textContent = bestScore + '%';
  // Charts
  const weekly = getWeeklyMinutes(sessions);
  setTimeout(() => {
    makeBarChart('dash-activity-chart', weekly.labels, weekly.counts, '#818cf8', 'Minutes');
    const slotEff = analyticsService.getSlotEffectiveness(sessions);
    makeBarChart('dash-slot-chart', Object.keys(slotEff), Object.values(slotEff).map(v => +v.toFixed(4)), '#c084fc', 'Effectiveness');
  }, 50);
  renderSessionsList('dash-sessions-list', sessions);
}