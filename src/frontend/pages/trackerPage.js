import { state } from '../../core/state.js';
import { database } from '../../backend/db/database.js';
import { renderSessionsList, showToast } from '../components/uiHelpers.js';
import { getTimeSlot, slotClass } from '../../core/utils.js';

export function init() {
  initTracker();
}

function initTracker() {
  const slotEl = document.getElementById('sess-slot');
  const dateEl = document.getElementById('sess-date');
  if (slotEl) slotEl.value = getTimeSlot();
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
  renderSessionsList('tracker-sessions-list', database.getLocal('sessions') || []);
  const slider = document.getElementById('focus-slider');
  if (slider) updateFocus(slider);
}

export function startTimer() {
  if (state.timerRunning) return;
  state.timerRunning = true;
  const slot = getTimeSlot();
  document.getElementById('btn-start').disabled = true;
  document.getElementById('btn-stop').disabled = false;
  document.getElementById('timer-dot').classList.add('active');
  document.getElementById('timer-status-text').textContent = 'In Progress';
  document.getElementById('sess-slot').value = slot;
  document.getElementById('timer-slot-badge').textContent = slot;
  document.getElementById('timer-slot-badge').className = 'slot-badge ' + slotClass(slot);
  state.timerInterval = setInterval(() => {
    state.timerSeconds++;
    const h = String(Math.floor(state.timerSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((state.timerSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(state.timerSeconds % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = h + ':' + m + ':' + s;
  }, 1000);
}

export function stopTimer() {
  if (!state.timerRunning) return;
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  document.getElementById('btn-start').disabled = false;
  document.getElementById('btn-stop').disabled = true;
  document.getElementById('timer-dot').classList.remove('active');
  document.getElementById('timer-dot').classList.add('stopped');
  document.getElementById('timer-status-text').textContent = 'Ended';
  document.getElementById('sess-duration').value = Math.round(state.timerSeconds / 60) || 1;
}

export function updateFocus(slider) {
  const val = slider.value;
  const focusBadge = document.getElementById('focus-badge');
  if (focusBadge) focusBadge.textContent = val;
  const pct = ((val - 1) / 4 * 100) + '%';
  slider.style.background = `linear-gradient(to right,#2563EB ${pct},#E2E8F0 ${pct})`;
}

export async function saveSession() {
  const duration = parseInt(document.getElementById('sess-duration').value);
  const focus = parseInt(document.getElementById('focus-slider').value);
  const slot = document.getElementById('sess-slot').value || getTimeSlot();
  const topic = document.getElementById('sess-topic').value.trim() || 'General Study';
  const date = document.getElementById('sess-date').value || new Date().toISOString().split('T')[0];
  if (!duration || duration < 1) { showToast('Please enter a valid duration (minutes)', 'error'); return; }
  const scores = database.getLocal('quiz_scores') || [];
  const lastScore = scores.length ? scores[scores.length - 1].pct : 0;
  const effectiveness = lastScore ? (focus * lastScore) / (duration * 100) : 0;
  const session = {
    id: Date.now(), date, slot, duration, focus, topic,
    effectiveness: +effectiveness.toFixed(6), quizScore: lastScore,
    timestamp: new Date().toISOString()
  };
  await database.saveSession(session);
  renderSessionsList('tracker-sessions-list', database.getLocal('sessions') || []);
  document.getElementById('sess-topic').value = '';
  document.getElementById('sess-duration').value = '';
  document.getElementById('timer-display').textContent = '00:00:00';
  state.timerSeconds = 0;
  state.timerRunning = false;
  document.getElementById('timer-dot').className = 'timer-dot';
  document.getElementById('timer-status-text').textContent = 'Ready';
  showToast('Session saved successfully! 🎉', 'success');
}