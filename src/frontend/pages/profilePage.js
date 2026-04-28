// src/frontend/pages/profilePage.js
// Public profile + reputation + edit my profile

import { showToast } from '../components/uiHelpers.js';

const API = '/api/profiles';

// Use the same localStorage key as the rest of the app ('sl_' prefix)
function getUser() {
  try { return JSON.parse(localStorage.getItem('sl_currentUser')); } catch { return null; }
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function safeParseJSON(val, fallback) {
  try { return JSON.parse(val) || fallback; } catch { return fallback; }
}

export function init(email) {
  const container = document.getElementById('page-profile');
  if (!container) return;

  const user = getUser();
  const targetEmail = email || user?.email;

  if (!targetEmail) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:60px">
        <div style="font-size:48px;margin-bottom:16px">👤</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">Not Logged In</div>
        <div style="color:var(--muted);font-size:14px">Please log in to view your profile.</div>
      </div>`;
    return;
  }

  const isOwn = user && user.email === targetEmail;
  loadProfile(targetEmail, isOwn);
}

async function loadProfile(email, isOwn) {
  const container = document.getElementById('page-profile');
  container.innerHTML = `<div class="qa-loading" style="padding:80px;text-align:center">Loading profile…</div>`;
  try {
    const res = await fetch(`${API}/${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const profile = await res.json();
    if (profile.error) throw new Error(profile.error);
    renderProfile(profile, isOwn);
  } catch (e) {
    container.innerHTML = `<div class="card" style="padding:40px;text-align:center;color:var(--muted)">❌ ${esc(e.message)}</div>`;
  }
}

function renderProfile(p, isOwn) {
  const container = document.getElementById('page-profile');
  const skills   = safeParseJSON(p.skills, []);
  const name     = p.name || 'Unknown User';
  const initials = (p.avatar_initials || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2));
  const badges   = calcBadges(p);

  container.innerHTML = `
    <div class="profile-page">

      <!-- Header card -->
      <div class="profile-header-card card">
        <div class="profile-avatar-lg" style="background:linear-gradient(135deg,#4338CA,#9333EA)">${esc(initials)}</div>
        <div class="profile-header-info">
          <div class="profile-name">${esc(name)}</div>
          ${p.college ? `<div class="profile-college">🏛️ ${esc(p.college)}</div>` : ''}
          <div class="profile-meta-row">
            ${p.branch ? `<span class="qa-q-branch">${esc(p.branch)}</span>` : ''}
            ${p.year ? `<span class="qa-tag">Year ${esc(String(p.year))}</span>` : ''}
            ${p.goal ? `<span class="qa-tag">🎯 ${esc(p.goal)}</span>` : ''}
          </div>
          ${p.bio ? `<div class="profile-bio">${esc(p.bio)}</div>` : ''}
          <div class="profile-skills">
            ${skills.map(s => `<span class="skill-chip">${esc(s)}</span>`).join('')}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-self:flex-start;min-width:110px">
          ${isOwn
            ? `<button class="btn-secondary" onclick="window._profileEdit()">✏️ Edit Profile</button>`
            : `<button class="btn-primary" onclick="window._profileConnect('${esc(p.email || '')}')">🤝 Connect</button>
               <button class="btn-secondary" onclick="window._profileMsg('${esc(p.email || '')}')">💬 Message</button>`}
        </div>
      </div>

      <!-- Stats -->
      <div class="profile-stats-row">
        <div class="profile-stat-card"><div class="profile-stat-val">${p.reputation || 0}</div><div class="profile-stat-lbl">⭐ Reputation</div></div>
        <div class="profile-stat-card"><div class="profile-stat-val">${p.questions_asked || 0}</div><div class="profile-stat-lbl">❓ Questions</div></div>
        <div class="profile-stat-card"><div class="profile-stat-val">${p.answers_given || 0}</div><div class="profile-stat-lbl">💬 Answers</div></div>
        <div class="profile-stat-card"><div class="profile-stat-val">${p.likes_earned || 0}</div><div class="profile-stat-lbl">👍 Likes</div></div>
      </div>

      <!-- Badges -->
      ${badges.length ? `
      <div class="card">
        <div class="card-title">🏅 Badges</div>
        <div class="profile-badges-row">
          ${badges.map(b => `<div class="dm-badge">${b.icon}<span>${b.label}</span></div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Top Answers -->
      ${p.top_answers && p.top_answers.length ? `
      <div class="card">
        <div class="card-title">🌟 Top Answers</div>
        ${p.top_answers.map(a => `
          <div class="profile-top-answer">
            <div class="profile-ta-q">Q: ${esc(a.question_title)}</div>
            <div class="profile-ta-body">${esc((a.body || '').slice(0, 200))}${(a.body || '').length > 200 ? '…' : ''}</div>
            <div class="qa-ans-actions" style="margin-top:8px">
              <span class="qa-stat-likes">👍 ${a.like_count}</span>
              ${a.is_accepted ? '<span class="qa-badge-accepted">✔ Accepted</span>' : ''}
            </div>
          </div>
        `).join('')}
      </div>` : ''}
    </div>

    <!-- Edit Modal -->
    <div id="profile-edit-modal" class="modal-overlay hidden" onclick="if(event.target===this)this.classList.add('hidden')">
      <div class="modal-box" style="max-width:540px">
        <div class="modal-title">✏️ Edit Profile</div>
        <div class="form-group"><label class="form-label">College / University</label>
          <input id="pe-college" class="form-input" value="${esc(p.college || '')}"></div>
        <div class="session-form">
          <div class="form-group"><label class="form-label">Branch</label>
            <select id="pe-branch" class="form-input">
              <option value="">Select branch</option>
              ${['CSE','IT','ECE','Mechanical','Civil','Other'].map(b =>
                `<option ${p.branch === b ? 'selected' : ''}>${b}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Year</label>
            <select id="pe-year" class="form-input">
              ${[1,2,3,4].map(y =>
                `<option value="${y}" ${p.year == y ? 'selected' : ''}>${y}${['st','nd','rd','th'][y-1]} Year</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Goal</label>
          <select id="pe-goal" class="form-input">
            ${['Interview Prep','Project Building','Exam Preparation','Career Switch','Skill Enhancement']
              .map(g => `<option ${p.goal === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Skills (comma separated)</label>
          <input id="pe-skills" class="form-input" value="${esc(skills.join(', '))}"></div>
        <div class="form-group"><label class="form-label">Bio</label>
          <textarea id="pe-bio" class="form-input" rows="3">${esc(p.bio || '')}</textarea></div>
        <button class="btn-full" onclick="window._profileSave()">💾 Save Profile</button>
      </div>
    </div>
  `;

  window._profileEdit = () => document.getElementById('profile-edit-modal')?.classList.remove('hidden');
  window._profileSave = () => saveProfile(p.email || getUser()?.email);
  window._profileConnect = connectUser;
  window._profileMsg = (email) => { if (window.showPage) window.showPage('messages', { chatWith: email }); };
}

async function saveProfile(email) {
  const user = getUser();
  if (!user) return;
  try {
    const payload = {
      user_email: user.email,
      college: document.getElementById('pe-college')?.value || '',
      branch: document.getElementById('pe-branch')?.value || '',
      year: document.getElementById('pe-year')?.value || '',
      goal: document.getElementById('pe-goal')?.value || '',
      skills: document.getElementById('pe-skills')?.value || '',
      bio: document.getElementById('pe-bio')?.value || '',
      avatar_initials: (user.name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'
    };
    const res = await fetch(`${API}/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Profile updated! ✅', 'success');
    document.getElementById('profile-edit-modal')?.classList.add('hidden');
    loadProfile(user.email, true);
  } catch (e) { showToast('Failed to save: ' + e.message, 'error'); }
}

async function connectUser(recipientEmail) {
  const user = getUser();
  if (!user) { showToast('Log in to connect', 'error'); return; }
  try {
    const res = await fetch(`${API}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester_email: user.email, recipient_email: recipientEmail })
    });
    const data = await res.json();
    showToast(data.error || 'Connection request sent! 🤝', data.error ? 'error' : 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

function calcBadges(p) {
  const badges = [];
  if ((p.reputation || 0) >= 50)  badges.push({ icon: '⭐', label: 'Rising Star' });
  if ((p.reputation || 0) >= 200) badges.push({ icon: '🌟', label: 'Expert' });
  if ((p.answers_given || 0) >= 5)  badges.push({ icon: '💬', label: 'Helper' });
  if ((p.likes_earned || 0) >= 10)  badges.push({ icon: '👍', label: 'Liked' });
  if ((p.questions_asked || 0) >= 3) badges.push({ icon: '❓', label: 'Curious' });
  return badges;
}
