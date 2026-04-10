import { database } from '../../backend/db/database.js';
import { analyticsService } from '../../backend/services/analyticsService.js';
import { insightService } from '../../backend/services/insightService.js';
import { escHtml } from '../../core/utils.js';

export function init() {
  // Insights page init
}

export function refreshInsights() {
  const sessions = database.getLocal('sessions') || [];
  const scores = database.getLocal('quiz_scores') || [];
  const threshEl = document.getElementById('insights-threshold-msg');
  const contentEl = document.getElementById('insights-content');
  if (sessions.length < 2 || scores.length < 1) {
    threshEl.classList.remove('hidden'); contentEl.style.display = 'none'; return;
  }
  threshEl.classList.add('hidden'); contentEl.style.display = '';
  const cards = analyticsService.generateInsights(sessions, scores);
  const container = document.getElementById('insights-cards-container');
  container.innerHTML = cards.map((c, i) => `
    <div class="insight-card" style="animation-delay:${i*0.05}s">
      <div class="insight-icon-box" style="background:${c.iconBg}">${c.icon}</div>
      <div class="insight-body">
        <span class="insight-tag tag-${c.type}">${c.type}</span>
        <div class="insight-title">${escHtml(c.title)}</div>
        <div class="insight-desc">${escHtml(c.desc)}</div>
        <div class="insight-data">📊 ${escHtml(c.data)}</div>
      </div>
    </div>`).join('');
  renderVideos(sessions, scores);
  renderRoadmap(sessions, scores);
}

function renderVideos(sessions, scores) {
  const vids = insightService.recommendVideos(sessions, scores);
  document.getElementById('videos-grid').innerHTML = vids.map(v => `
    <div class="video-card">
      <span class="video-topic-badge">${escHtml(v.topic)}</span>
      <div class="video-title">${escHtml(v.title)}</div>
      <div class="video-meta">${escHtml(v.channel)} · ${v.duration}</div>
      <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="video-watch-btn">▶ Watch Now</a>
    </div>`).join('');
}

function renderRoadmap(sessions, scores) {
  const steps = insightService.generateRoadmap(sessions, scores);
  document.getElementById('roadmap-steps').innerHTML = steps.map(s => `
    <div class="roadmap-step">
      <div class="roadmap-step-num">${s.num}</div>
      <div class="roadmap-step-body">
        <div class="roadmap-step-title">${escHtml(s.title)}</div>
        <div class="roadmap-step-desc">${escHtml(s.desc)}</div>
        <button class="roadmap-action-btn" onclick="showPage('${s.page}')">${escHtml(s.action)} →</button>
      </div>
    </div>`).join('');
}