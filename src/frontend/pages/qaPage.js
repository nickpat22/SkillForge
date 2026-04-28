// src/frontend/pages/qaPage.js
// Q&A Hub — Brainly-style community Q&A

import { showToast } from '../components/uiHelpers.js';

const API = '/api/qa';
let currentTab = 'recent';

// Helper: read user from localStorage (existing app stores with 'sl_' prefix)
function getUser() {
  try { return JSON.parse(localStorage.getItem('sl_currentUser')); } catch { return null; }
}

export function init() {
  renderQAPage();
}

// ── Render the full Q&A shell ────────────────────────────────────────────────
function renderQAPage() {
  const container = document.getElementById('page-qa');
  if (!container) return;
  container.innerHTML = `
    <div class="qa-header">
      <div>
        <div class="section-title">💬 Q&A Hub</div>
        <div class="section-sub">Ask questions, get real answers from students</div>
      </div>
      <button class="btn-primary" id="qa-ask-btn" onclick="window._qaAsk()">✏️ Ask Question</button>
    </div>
    <div class="qa-search-wrap">
      <input id="qa-search" class="qa-search-input" type="text" placeholder="🔍 Search questions…" oninput="window._qaSearch(this.value)">
    </div>
    <div id="qa-content"></div>
  `;

  window._qaAsk = showAskForm;
  window._qaSearch = debounce(searchQuestions, 400);
  window._qaBack = showFeed;
  window._qaSubmitQuestion = submitQuestion;
  window._qaOpenQuestion = openQuestion;
  window._qaLike = likeAnswer;
  window._qaAccept = acceptAnswer;
  window._qaSubmitAnswer = submitAnswer;
  window._qaTab = switchTab;

  showFeed('recent');
}

// ── Feed view ────────────────────────────────────────────────────────────────
async function showFeed(tab) {
  if (tab) currentTab = tab;
  const user = getUser();
  const branch = user?.branch ? `&branch=${encodeURIComponent(user.branch)}` : '';
  const url = `${API}?tab=${currentTab}${currentTab === 'branch' ? branch : ''}`;

  setContent(`
    <div class="qa-tabs">
      <button class="qa-tab ${currentTab==='recent'?'active':''}" onclick="window._qaTab('recent')">🕐 Recent</button>
      <button class="qa-tab ${currentTab==='trending'?'active':''}" onclick="window._qaTab('trending')">🔥 Trending</button>
      <button class="qa-tab ${currentTab==='unanswered'?'active':''}" onclick="window._qaTab('unanswered')">❓ Unanswered</button>
      <button class="qa-tab ${currentTab==='branch'?'active':''}" onclick="window._qaTab('branch')">🎓 My Branch</button>
    </div>
    <div id="qa-list" class="qa-list"><div class="qa-loading">Loading questions…</div></div>
  `);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const questions = await res.json();
    renderQuestionList(questions);
  } catch (e) {
    const el = document.getElementById('qa-list');
    if (el) el.innerHTML = `<div class="qa-empty">❌ Failed to load questions. (${e.message})</div>`;
  }
}

function switchTab(tab) { showFeed(tab); }

function renderQuestionList(questions) {
  const el = document.getElementById('qa-list');
  if (!el) return;
  if (!questions.length) {
    el.innerHTML = '<div class="qa-empty">No questions yet. Be the first to ask! 🌟</div>';
    return;
  }
  el.innerHTML = questions.map(q => {
    const tags = safeParseJSON(q.tags, []);
    return `
    <div class="qa-question-card" onclick="window._qaOpenQuestion(${q.id})">
      <div class="qa-q-meta">
        <span class="qa-q-author">👤 ${esc(q.author_name)}</span>
        ${q.branch ? `<span class="qa-q-branch">${esc(q.branch)}</span>` : ''}
        ${q.topic ? `<span class="qa-q-topic">${esc(q.topic)}</span>` : ''}
        <span class="qa-q-time">${timeAgo(q.created_at)}</span>
      </div>
      <div class="qa-q-title">${esc(q.title)}</div>
      <div class="qa-q-tags">${tags.map(t => `<span class="qa-tag">${esc(t)}</span>`).join('')}</div>
      <div class="qa-q-stats">
        <span class="${q.answer_count > 0 ? 'qa-stat-answered' : 'qa-stat-unanswered'}">
          ${q.answer_count > 0 ? `✅ ${q.answer_count} answer${q.answer_count !== 1 ? 's' : ''}` : '❓ Unanswered'}
        </span>
        <span class="qa-stat-likes">👍 ${q.total_likes || 0}</span>
        ${q.is_answered ? '<span class="qa-badge-solved">✔ Solved</span>' : ''}
      </div>
    </div>`;
  }).join('');
}

// ── Single question view ─────────────────────────────────────────────────────
async function openQuestion(id) {
  const user = getUser();
  setContent(`<div class="qa-loading">Loading question…</div>`);
  try {
    const res = await fetch(`${API}/${id}?viewer_email=${encodeURIComponent(user?.email || '')}`);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const { question, answers } = await res.json();
    renderQuestionDetail(question, answers, user);
  } catch (e) {
    setContent(`<div class="qa-empty">❌ Failed to load question. (${e.message})</div>`);
  }
}

function renderQuestionDetail(q, answers, user) {
  const tags = safeParseJSON(q.tags, []);
  document.getElementById('qa-content').innerHTML = `
    <button class="module-back" onclick="window._qaBack()">← Back to Questions</button>
    <div class="qa-detail-card">
      <h2 class="qa-detail-title">${esc(q.title)}</h2>
      <div class="qa-q-meta" style="margin-bottom:12px">
        <span class="qa-q-author">👤 ${esc(q.author_name)}</span>
        ${q.branch ? `<span class="qa-q-branch">${esc(q.branch)}</span>` : ''}
        <span class="qa-q-time">${timeAgo(q.created_at)}</span>
        ${q.is_answered ? '<span class="qa-badge-solved">✔ Solved</span>' : ''}
      </div>
      <div class="qa-detail-tags">${tags.map(t => `<span class="qa-tag">${esc(t)}</span>`).join('')}</div>
      <div class="qa-detail-body">${md(q.body)}</div>
    </div>

    <div class="qa-answers-header"><strong>${answers.length} Answer${answers.length !== 1 ? 's' : ''}</strong></div>
    <div id="qa-answers-list">
      ${answers.length ? answers.map(a => answerCard(a, q, user)).join('') : '<div class="qa-empty">No answers yet. Share your knowledge!</div>'}
    </div>

    ${user ? `
    <div class="card" style="margin-top:24px">
      <div class="card-title">✍️ Your Answer</div>
      <textarea id="qa-answer-body" class="qa-answer-textarea" rows="6" placeholder="Write a clear, detailed answer…"></textarea>
      <button class="btn-primary" style="margin-top:12px" onclick="window._qaSubmitAnswer(${q.id})">Post Answer</button>
    </div>` : '<div class="card" style="margin-top:16px;text-align:center;color:var(--muted)">Log in to post an answer.</div>'}
  `;
}

function answerCard(a, q, user) {
  const isAuthor = user && q.user_email === user.email;
  const liked = Number(a.user_liked) > 0;
  const verified = Number(a.like_count) >= 10;
  return `
  <div class="qa-answer-card ${a.is_accepted ? 'qa-answer-accepted' : ''}">
    <div class="qa-ans-meta">
      <span class="qa-q-author">👤 ${esc(a.author_name)}</span>
      ${a.is_accepted ? '<span class="qa-badge-accepted">✔ Accepted</span>' : ''}
      ${verified ? '<span class="qa-badge-verified">🏅 Community Verified</span>' : ''}
      <span class="qa-q-time">${timeAgo(a.created_at)}</span>
    </div>
    <div class="qa-ans-body">${md(a.body)}</div>
    <div class="qa-ans-actions">
      <button class="qa-like-btn ${liked ? 'qa-liked' : ''}" onclick="window._qaLike(${a.id}, this)">
        👍 <span class="qa-like-count">${a.like_count || 0}</span>
      </button>
      ${isAuthor && !a.is_accepted ? `<button class="qa-accept-btn" onclick="window._qaAccept(${a.id}, ${q.id})">✔ Accept</button>` : ''}
    </div>
  </div>`;
}

// ── Ask form ─────────────────────────────────────────────────────────────────
function showAskForm() {
  const user = getUser();
  if (!user) { showToast('Please log in to ask a question', 'error'); return; }
  setContent(`
    <button class="module-back" onclick="window._qaBack()">← Back</button>
    <div class="card" style="max-width:780px;margin:0 auto">
      <div class="card-title">✏️ Ask a Question</div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:20px">Get answers from real students. Be specific and clear.</p>
      <div class="form-group">
        <label class="form-label">Title <span style="color:#ef4444">*</span></label>
        <input id="qa-title" class="form-input" type="text" placeholder="What is your question? Be specific.">
      </div>
      <div class="form-group">
        <label class="form-label">Details <span style="color:#ef4444">*</span></label>
        <textarea id="qa-body" class="qa-answer-textarea" rows="8" placeholder="Explain your question. Include code snippets if relevant."></textarea>
      </div>
      <div class="session-form">
        <div class="form-group"><label class="form-label">Topic</label>
          <input id="qa-topic" class="form-input" type="text" placeholder="e.g. Binary Trees"></div>
        <div class="form-group"><label class="form-label">Branch</label>
          <select id="qa-branch" class="form-input">
            <option value="">All Branches</option>
            <option>CSE</option><option>IT</option><option>ECE</option>
            <option>Mechanical</option><option>Civil</option><option>Other</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Tags (comma separated)</label>
        <input id="qa-tags" class="form-input" type="text" placeholder="e.g. javascript, array, beginner">
      </div>
      <button class="btn-primary" style="width:100%;margin-top:8px" onclick="window._qaSubmitQuestion()">🚀 Post Question</button>
    </div>
  `);
}

async function submitQuestion() {
  const user = getUser();
  if (!user) return;
  const title = document.getElementById('qa-title')?.value.trim();
  const body  = document.getElementById('qa-body')?.value.trim();
  if (!title || !body) { showToast('Title and details are required', 'error'); return; }
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: user.email, title, body,
        tags: document.getElementById('qa-tags')?.value || '',
        branch: document.getElementById('qa-branch')?.value || '',
        topic: document.getElementById('qa-topic')?.value || ''
      })
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Question posted! +5 reputation 🎉', 'success');
    openQuestion(data.id);
  } catch (e) { showToast('Failed to post: ' + e.message, 'error'); }
}

async function submitAnswer(questionId) {
  const user = getUser();
  if (!user) return;
  const body = document.getElementById('qa-answer-body')?.value.trim();
  if (!body) { showToast('Answer cannot be empty', 'error'); return; }
  try {
    const res = await fetch(`${API}/${questionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: user.email, body })
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Answer posted! +2 reputation 🎉', 'success');
    openQuestion(questionId);
  } catch (e) { showToast('Failed to post: ' + e.message, 'error'); }
}

async function likeAnswer(answerId, btn) {
  const user = getUser();
  if (!user) { showToast('Log in to like answers', 'error'); return; }
  try {
    const res = await fetch(`${API}/answers/${answerId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: user.email })
    });
    const data = await res.json();
    const countEl = btn.querySelector('.qa-like-count');
    const current = parseInt(countEl?.textContent || '0');
    if (data.liked) { btn.classList.add('qa-liked'); if (countEl) countEl.textContent = current + 1; }
    else { btn.classList.remove('qa-liked'); if (countEl) countEl.textContent = Math.max(0, current - 1); }
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function acceptAnswer(answerId, questionId) {
  const user = getUser();
  if (!user) return;
  try {
    const res = await fetch(`${API}/answers/${answerId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: user.email })
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    showToast('Answer accepted! +10 reputation 🏆', 'success');
    openQuestion(questionId);
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function searchQuestions(q) {
  if (!q.trim()) { showFeed(currentTab); return; }
  setContent(`<div class="qa-loading">Searching…</div>`);
  try {
    const res = await fetch(`${API}/search/q?q=${encodeURIComponent(q)}`);
    const questions = await res.json();
    setContent(`
      <div class="qa-tabs" style="margin-bottom:16px">
        <strong style="color:#94a3b8">Results for "${esc(q)}"</strong>
        <button class="qa-tab" style="margin-left:auto" onclick="window._qaBack()">✕ Clear</button>
      </div>
      <div id="qa-list" class="qa-list"></div>
    `);
    renderQuestionList(questions);
  } catch { /* ignore */ }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function setContent(html) {
  const el = document.getElementById('qa-content');
  if (el) el.innerHTML = html;
}

function md(text) {
  if (!text) return '';
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="qa-code-block"><code>${esc(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="qa-inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function safeParseJSON(val, fallback) {
  try { return JSON.parse(val) || fallback; } catch { return fallback; }
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
