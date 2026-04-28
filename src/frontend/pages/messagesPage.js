// src/frontend/pages/messagesPage.js
// Direct messaging — inbox + conversation threads

import { showToast } from '../components/uiHelpers.js';

const API = '/api/messages';
let activeThread = null;
let socket = null;
let pollInterval = null;

// Use the same localStorage key as the rest of the app ('sl_' prefix)
function getUser() {
  try { return JSON.parse(localStorage.getItem('sl_currentUser')); } catch { return null; }
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function init(opts = {}) {
  const container = document.getElementById('page-messages');
  if (!container) return;

  const user = getUser();
  if (!user || !user.email) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:60px">
        <div style="font-size:48px;margin-bottom:16px">💬</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">Not Logged In</div>
        <div style="color:var(--muted);font-size:14px">Please log in to use messages.</div>
      </div>`;
    return;
  }

  renderShell(user);
  loadConversations(user);

  // Try Socket.IO (optional — falls back to polling if unavailable)
  try {
    if (window.io && !socket) {
      socket = window.io({ transports: ['websocket'], reconnection: false });
      socket.emit('join', user.email);
      socket.on('new_message', (msg) => {
        if (activeThread === msg.sender_email) {
          appendBubble(msg, user.email);
        } else {
          showToast(`💬 New message from ${msg.sender_name || msg.sender_email}`, 'success');
        }
        loadConversations(user);
      });
    }
  } catch { /* Socket.IO not available */ }

  if (opts.chatWith) openThread(opts.chatWith, user);
}

export function cleanup() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
  }
  activeThread = null;
}

// ── Render page shell ─────────────────────────────────────────────────────────
function renderShell(user) {
  const container = document.getElementById('page-messages');
  container.innerHTML = `
    <div class="msg-shell">
      <div class="msg-sidebar">
        <div class="msg-sidebar-header">
          <input id="msg-search" class="qa-search-input" type="text" placeholder="🔍 Search…" oninput="window._msgFilter(this.value)" style="width:100%;margin:0">
        </div>
        <div id="msg-conv-list"><div class="qa-loading" style="padding:30px;text-align:center;font-size:13px">Loading…</div></div>
      </div>
      <div class="msg-main" id="msg-main">
        <div class="msg-empty-state">
          <div style="font-size:48px;margin-bottom:16px">💬</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:8px">Select a conversation</div>
          <div style="font-size:13px;color:var(--muted)">Pick someone from the left, or connect with collaborators to start chatting.</div>
        </div>
      </div>
    </div>
  `;
  window._msgFilter = filterConvs;
  window._msgOpenThread = (email) => openThread(email, user);
  window._msgSend = () => sendMessage(user);
}

// ── Load conversation list ────────────────────────────────────────────────────
async function loadConversations(user) {
  const list = document.getElementById('msg-conv-list');
  if (!list) return;
  try {
    const res = await fetch(`${API}/conversations?email=${encodeURIComponent(user.email)}`);
    if (!res.ok) throw new Error(`${res.status}`);
    const convs = await res.json();

    if (!convs.length) {
      list.innerHTML = `<div class="qa-empty" style="padding:30px;font-size:13px">No conversations yet.<br><br>Connect with students to start messaging!</div>`;
      return;
    }

    list.innerHTML = convs.map(c => `
      <div class="msg-conv-item ${activeThread === c.other_email ? 'msg-conv-active' : ''}"
        onclick="window._msgOpenThread('${esc(c.other_email)}')">
        <div class="msg-conv-avatar">${(c.other_name || '?').slice(0, 1).toUpperCase()}</div>
        <div class="msg-conv-info">
          <div class="msg-conv-name">${esc(c.other_name || c.other_email)}</div>
          <div class="msg-conv-last">${esc((c.last_message || '').slice(0, 40))}${(c.last_message || '').length > 40 ? '…' : ''}</div>
        </div>
        ${c.unread_count > 0 ? `<div class="msg-unread-badge">${c.unread_count}</div>` : ''}
      </div>
    `).join('');
  } catch { /* silently ignore */ }
}

// ── Open a conversation thread ────────────────────────────────────────────────
async function openThread(otherEmail, user) {
  activeThread = otherEmail;

  // Highlight in sidebar
  document.querySelectorAll('.msg-conv-item').forEach(el => el.classList.remove('msg-conv-active'));
  document.querySelectorAll('.msg-conv-item').forEach(el => {
    if (el.textContent && el.getAttribute('onclick')?.includes(otherEmail)) {
      el.classList.add('msg-conv-active');
    }
  });

  // Fetch other person's name
  let otherName = otherEmail;
  try {
    const pr = await fetch(`/api/profiles/${encodeURIComponent(otherEmail)}`);
    if (pr.ok) { const pd = await pr.json(); if (pd.name) otherName = pd.name; }
  } catch {}

  const main = document.getElementById('msg-main');
  if (!main) return;
  main.innerHTML = `
    <div class="msg-thread-header">
      <div class="msg-conv-avatar" style="width:36px;height:36px;font-size:14px">${otherName.slice(0,1).toUpperCase()}</div>
      <div>
        <div style="font-weight:700;color:var(--text);font-size:15px">${esc(otherName)}</div>
        <div style="font-size:11px;color:var(--muted)">${esc(otherEmail)}</div>
      </div>
    </div>
    <div class="msg-messages" id="msg-messages">
      <div class="qa-loading" style="padding:40px;text-align:center">Loading messages…</div>
    </div>
    <div class="msg-input-row">
      <input id="msg-input" class="msg-input" type="text" placeholder="Type a message…"
        onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();window._msgSend();}">
      <button class="chat-send-btn" onclick="window._msgSend()">Send</button>
    </div>
  `;

  loadThread(user, otherEmail);

  // Poll every 5s when socket not available
  if (pollInterval) clearInterval(pollInterval);
  if (!socket) {
    pollInterval = setInterval(() => {
      if (activeThread === otherEmail) loadThread(user, otherEmail, true);
    }, 5000);
  }
}

// ── Load thread messages ──────────────────────────────────────────────────────
async function loadThread(user, otherEmail, silent = false) {
  const el = document.getElementById('msg-messages');
  if (!el) return;
  if (!silent) el.innerHTML = '<div class="qa-loading" style="padding:40px;text-align:center">Loading…</div>';
  try {
    const res = await fetch(`${API}/thread?email=${encodeURIComponent(user.email)}&other_email=${encodeURIComponent(otherEmail)}`);
    if (!res.ok) throw new Error(`${res.status}`);
    const messages = await res.json();
    el.innerHTML = messages.length
      ? messages.map(m => bubbleHtml(m, user.email)).join('')
      : `<div class="qa-empty" style="padding:40px;text-align:center">No messages yet. Say hello! 👋</div>`;
    el.scrollTop = el.scrollHeight;
  } catch { /* ignore */ }
}

function bubbleHtml(m, myEmail) {
  const mine = m.sender_email === myEmail;
  return `
  <div class="msg-bubble-wrap ${mine ? 'msg-mine' : 'msg-theirs'}">
    <div class="msg-bubble ${mine ? 'msg-bubble-mine' : 'msg-bubble-theirs'}">
      <div class="msg-bubble-text">${esc(m.body)}</div>
      <div class="msg-bubble-time">${timeAgo(m.created_at)}</div>
    </div>
  </div>`;
}

function appendBubble(msg, myEmail) {
  const el = document.getElementById('msg-messages');
  if (!el) return;
  el.insertAdjacentHTML('beforeend', bubbleHtml(msg, myEmail));
  el.scrollTop = el.scrollHeight;
}

// ── Send message ──────────────────────────────────────────────────────────────
async function sendMessage(user) {
  const input = document.getElementById('msg-input');
  const body  = input?.value.trim();
  if (!body || !activeThread) return;
  input.value = '';
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_email: user.email, recipient_email: activeThread, body })
    });
    if (!res.ok) { showToast('Failed to send', 'error'); return; }
    const msg = await res.json();
    if (msg.error) { showToast(msg.error, 'error'); return; }
    appendBubble(msg, user.email);
    loadConversations(user);
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

function filterConvs(q) {
  document.querySelectorAll('.msg-conv-item').forEach(el => {
    const name = el.querySelector('.msg-conv-name')?.textContent?.toLowerCase() || '';
    el.style.display = name.includes(q.toLowerCase()) ? '' : 'none';
  });
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
