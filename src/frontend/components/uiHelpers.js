import { escHtml } from '../../core/utils.js';

export function renderSessionsList(containerId, sessions) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const arr = [...(sessions||[])].reverse().slice(0,8);
  if (!arr.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">No sessions yet</div><div class="empty-sub">Start your first study session!</div></div>';
    return;
  }
  el.innerHTML = arr.map(s => `
    <div class="session-item">
      <span class="slot-badge ${slotClass(s.slot)}">${s.slot||'—'}</span>
      <div class="session-info"><div class="session-topic">${escHtml(s.topic||'General Study')}</div><div class="session-meta">${s.duration}min · Focus ${s.focus}/5 · ${s.date}</div></div>
      <div class="session-eff">⚡ ${s.effectiveness ? (s.effectiveness*100).toFixed(1)+'%' : '—'}</div>
    </div>`).join('');
}

export function showToast(msg, type='info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast toast-' + type;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'),400); }, 3200);
  t.classList.remove('hidden');
}

export function showFieldError(fieldId, msg) {
  const inp = document.getElementById(fieldId);
  if (inp) inp.classList.add('error');
  const err = document.getElementById(fieldId + '-err');
  if (err) err.textContent = msg;
}

export function clearFieldError(fieldId) {
  const inp = document.getElementById(fieldId);
  if (inp) inp.classList.remove('error');
  const err = document.getElementById(fieldId + '-err');
  if (err) err.textContent = '';
}

function slotClass(slot) {
  const m = { Morning:'slot-morning', Afternoon:'slot-afternoon', Evening:'slot-evening', Night:'slot-night' };
  return m[slot] || 'slot-morning';
}