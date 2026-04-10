// Utility functions

export function escHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function getYTId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&]+)/);
  return m ? m[1] : '';
}

export function avgEffectiveness(sessions) {
  if (!sessions || !sessions.length) return 0;
  const vals = sessions.map(s => s.effectiveness || 0);
  return vals.reduce((a,b) => a+b, 0) / vals.length;
}

export function computeSlotEffectiveness(sessions) {
  const slots = { Morning:[], Afternoon:[], Evening:[], Night:[] };
  (sessions||[]).forEach(s => { if (slots[s.slot]) slots[s.slot].push(s.effectiveness||0); });
  const result = {};
  for (const k in slots) result[k] = slots[k].length ? slots[k].reduce((a,b)=>a+b,0)/slots[k].length : 0;
  return result;
}

export function bestTimeSlot(sessions) {
  const eff = computeSlotEffectiveness(sessions);
  return Object.entries(eff).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
}

export function calcConsistency(sessions) {
  if (!sessions || !sessions.length) return 0;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const thisWeek = sessions.filter(s => new Date(s.date) >= startOfWeek);
  const uniqueDays = new Set(thisWeek.map(s => s.date)).size;
  return Math.round((uniqueDays / 7) * 100);
}

export function calcStreak(sessions) {
  if (!sessions || !sessions.length) return 0;
  const dates = new Set(sessions.map(s => s.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (dates.has(ds)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function calcImprovement(scores) {
  if (!scores || scores.length < 2) return 0;
  const half = Math.ceil(scores.length / 2);
  const past = scores.slice(0, half).map(s => s.pct || 0);
  const recent = scores.slice(half).map(s => s.pct || 0);
  const pastAvg = past.reduce((a,b)=>a+b,0) / past.length;
  const recentAvg = recent.reduce((a,b)=>a+b,0) / recent.length;
  return Math.round(recentAvg - pastAvg);
}

export function getWeeklyCounts(sessions, weeks=4) {
  const labels = [], counts = [];
  for (let w = weeks-1; w >= 0; w--) {
    const start = new Date(); start.setDate(start.getDate() - start.getDay() - w*7); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    labels.push('Wk ' + (weeks-w));
    counts.push((sessions||[]).filter(s => { const d = new Date(s.date); return d >= start && d < end; }).length);
  }
  return { labels, counts };
}

export function getWeeklyMinutes(sessions) {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const counts = new Array(7).fill(0);
  const now = new Date(), day = now.getDay();
  const monday = new Date(now); monday.setDate(now.getDate() - ((day+6)%7)); monday.setHours(0,0,0,0);
  (sessions||[]).forEach(s => {
    const d = new Date(s.date);
    if (d >= monday) {
      const idx = (d.getDay()+6)%7;
      if (idx < 7) counts[idx] += s.duration || 0;
    }
  });
  return { labels: days, counts };
}

export function getTimeSlot() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 21) return 'Evening';
  return 'Night';
}

export function slotClass(slot) {
  const m = { Morning:'slot-morning', Afternoon:'slot-afternoon', Evening:'slot-evening', Night:'slot-night' };
  return m[slot] || 'slot-morning';
}