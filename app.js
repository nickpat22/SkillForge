// SkillForge — Modular App Entry Point
console.log("My website is running");
// Core modules
import { state } from './src/core/state.js';
import * as utils from './src/core/utils.js';

// Data modules
import { QUIZ_QUESTIONS } from './src/backend/data/quizData.js';
import { LADDER_TRACKS } from './src/backend/data/roadmapData.js';
import { VIDEO_LIBRARY } from './src/backend/data/videoData.js';
import { COLLAB_DATA } from './src/backend/data/collaboratorData.js';

// Service modules
import { analyticsService } from './src/backend/services/analyticsService.js';
import { plannerService } from './src/backend/services/plannerService.js';
import { quizService } from './src/backend/services/quizService.js';
import { insightService } from './src/backend/services/insightService.js';

// Database module
import { database } from './src/backend/db/database.js';

// Component modules
import { makeBarChart, makeLineChart } from './src/frontend/components/chartHelpers.js';
import { showToast } from './src/frontend/components/uiHelpers.js';

// Page modules
import * as dashboardPage from './src/frontend/pages/dashboardPage.js';
import * as trackerPage from './src/frontend/pages/trackerPage.js';
import * as assessmentPage from './src/frontend/pages/assessmentPage.js';
import * as analyticsPage from './src/frontend/pages/analyticsPage.js';
import * as insightsPage from './src/frontend/pages/insightsPage.js';
import * as plannerPage from './src/frontend/pages/plannerPage.js';
import * as modulePage from './src/frontend/pages/modulePage.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize database
  database.init();

  // Initialize services with data
  plannerService.init ? plannerService.init(LADDER_TRACKS) : null;
  quizService.init(QUIZ_QUESTIONS);
  insightService.init ? insightService.init(VIDEO_LIBRARY, COLLAB_DATA) : null;

  // Initialize all page modules
  dashboardPage.init();
  trackerPage.init();
  assessmentPage.init();
  analyticsPage.init();
  insightsPage.init();
  plannerPage.init();
  modulePage.init();

  // Set up navigation
  setupNavigation();

  // Load initial view
  const user = database.getLocal('currentUser');
  if (user) {
    state.currentUser = user;
    showApp();
    showPage('dashboard');
  } else {
    showLanding();
  }
});

// Navigation setup
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.id.replace('nav-', '');
      showPage(page);
    });
  });
}

// Global showPage function
window.showPage = function(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + pageId);
  const navEl = document.getElementById('nav-' + pageId);
  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  // Auto-refresh data when navigating
  if (pageId === 'dashboard') dashboardPage.refreshDashboard();
  if (pageId === 'analytics') analyticsPage.refreshAnalytics();
  if (pageId === 'insights') insightsPage.refreshInsights();
};

// Auth functions
window.handleLogin = async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!email || !password) { showToast('Please enter email and password', 'error'); return; }
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      state.currentUser = data.user;
      database.setLocal('currentUser', data.user);
      document.getElementById('login-modal').classList.add('hidden');
      await database.syncFromApi();
      showApp();
      showToast('Welcome, ' + data.user.name + '!', 'success');
      dashboardPage.refreshDashboard();
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error during login', 'error');
  }
};

window.logout = () => {
  state.currentUser = null;
  database.setLocal('currentUser', null);
  showLanding();
};

window.handleLogout = window.logout;

window.showAuth = (tab) => {
  document.getElementById('login-modal').classList.remove('hidden');
  window.switchTab(tab);
};

window.switchTab = (tab) => {
  document.querySelectorAll('#login-form, #signup-form').forEach(f => f.classList.add('hidden'));
  const el = document.getElementById(tab + '-form');
  if (el) el.classList.remove('hidden');
};

window.handleSignup = async (event) => {
  event.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-pass').value.trim();
  if (!name || !email || !pass) { showToast('Please fill all fields', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
  
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });
    const data = await res.json();
    if (res.ok) {
      state.currentUser = data.user;
      database.setLocal('currentUser', data.user);
      document.getElementById('login-modal').classList.add('hidden');
      await database.syncFromApi();
      showApp();
      showToast('Account created! Welcome, ' + name + '!', 'success');
      refreshDashboard();
    } else {
      showToast(data.error || 'Signup failed', 'error');
    }
  } catch (err) {
    showToast('Network error during signup', 'error');
  }
};

window.showLanding = () => {
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('landing-page').classList.remove('hidden');
};

function showApp() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  showPage('dashboard');
}
window.showApp = showApp;

window.toggleSidebar = () => {
  document.getElementById('sidebar').classList.toggle('active');
  document.getElementById('sidebar-overlay').classList.toggle('active');
};

window.closeSidebar = () => {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebar-overlay').classList.remove('active');
};

// Quiz functions (assessment page)
window.startQuiz = () => assessmentPage.initQuiz();
window.selectOption = (idx) => assessmentPage.selectOption(idx);
window.nextQuestion = () => assessmentPage.nextQuestion();
window.retakeQuiz = () => assessmentPage.retakeQuiz();
window.saveQuizScore = async () => await assessmentPage.saveQuizScore();

// Tracker functions
window.startSession = () => trackerPage.startTimer();
window.stopSession = () => trackerPage.stopTimer();
window.saveSession = async () => await trackerPage.saveSession();
window.updateFocus = (slider) => trackerPage.updateFocus(slider);

// Planner functions
window.generatePlan = () => plannerPage.generatePlan();
window.startLearningJourney = () => plannerPage.startLearningJourney();
window.selectTrack = (trackKey) => plannerPage.selectTrack(trackKey);
window.renderLadderSteps = (trackKey) => plannerPage.renderLadderSteps(trackKey);

// Module functions
window.openModuleView = (trackKey, stepId) => modulePage.openModuleView(trackKey, stepId);
window.backToLadder = async () => await modulePage.backToLadder();
window.openModuleQuiz = () => modulePage.openModuleQuiz();
window.miniSelectOption = (idx) => modulePage.miniSelectOption(idx);
window.miniQuizNext = () => modulePage.miniQuizNext();
window.closeMiniQuiz = async () => await modulePage.closeMiniQuiz();

// Analytics functions
window.refreshAnalytics = () => analyticsPage.refreshAnalytics();

// Insights functions
window.refreshInsights = () => insightsPage.refreshInsights();

// Dashboard functions
window.refreshDashboard = () => dashboardPage.refreshDashboard();

window.openGlobalAi = () => {
  showPage('ai');
  setTimeout(() => {
    document.getElementById('chat-input').focus();
  }, 100);
};

// AI Assistant — Powered by Gemini
import { aiService } from './src/backend/services/aiService.js';

let chatHistory = [];

window.sendMessage = async () => {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  const chat = document.getElementById('chat-messages');

  // Add user message
  chat.innerHTML += `<div class="chat-msg user-msg"><div class="chat-avatar user-avatar">👤</div><div class="chat-bubble user-bubble">${utils.escHtml(msg)}</div></div>`;
  input.value = '';
  input.disabled = true;
  document.getElementById('chat-send-btn').disabled = true;

  // Add typing indicator
  const typingId = 'typing-' + Date.now();
  chat.innerHTML += `<div class="chat-msg bot-msg" id="${typingId}"><div class="chat-avatar bot-avatar">🤖</div><div class="chat-bubble bot-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>`;
  chat.scrollTop = chat.scrollHeight;

  // Track conversation
  chatHistory.push({ role: 'user', text: msg });

  try {

    const response = await aiService.chat(msg, chatHistory);
    chatHistory.push({ role: 'assistant', text: response });

    // Remove typing indicator and add response
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    // Convert markdown bold to HTML
    const formattedResponse = formatAiResponse(response);
    chat.innerHTML += `<div class="chat-msg bot-msg"><div class="chat-avatar bot-avatar">🤖</div><div class="chat-bubble bot-bubble">${formattedResponse}</div></div>`;
  } catch (err) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    let errorMsg = 'Sorry, something went wrong. Please try again.';
    if (err.message === 'NO_API_KEY') {
      errorMsg = '🔑 <strong>API key required!</strong> Click the "⚙️ API Key" button above to configure your AI provider in the Platform Integrations menu. <button class="btn-small" onclick="openApiKeyModal()" style="margin-left:8px">Set Up Now</button>';
    } else if (err.message === 'INVALID_API_KEY') {
      errorMsg = '❌ <strong>Invalid API key.</strong> Please check your AI API key in settings. <button class="btn-small" onclick="openApiKeyModal()" style="margin-left:8px">Update Key</button>';
    } else if (err.message.includes('QUOTA_EXCEEDED')) {
      errorMsg = '⏳ <strong>Quota Exceeded.</strong> The provided API key has reached its limit. Please configure your own API key in Settings. <button class="btn-small" onclick="openApiKeyModal()" style="margin-left:8px">Update Key</button>';
    }
    chat.innerHTML += `<div class="chat-msg bot-msg"><div class="chat-avatar bot-avatar">🤖</div><div class="chat-bubble bot-bubble error-bubble">${errorMsg}</div></div>`;
  }

  input.disabled = false;
  document.getElementById('chat-send-btn').disabled = false;
  input.focus();
  chat.scrollTop = chat.scrollHeight;
};

window.sendQuickMessage = (msg) => {
  document.getElementById('chat-input').value = msg;
  window.sendMessage();
};

// === API Key Management ===
window.openApiKeyModal = () => {
  const modal = document.getElementById('api-key-modal');
  modal.classList.remove('hidden');
  
  // Load existing configuration
  const config = aiService.getConfig();
  document.getElementById('ai-provider-select').value = config.provider || 'gemini';
  document.getElementById('gemini-api-key-input').value = config.keys.gemini || '';
  document.getElementById('openai-api-key-input').value = config.keys.openai || '';
  document.getElementById('anthropic-api-key-input').value = config.keys.anthropic || '';
  document.getElementById('youtube-api-key-input').value = database.getLocal('youtube_api_key') || '';
  
  if (aiService.hasApiKey()) {
    document.getElementById('api-key-status').innerHTML = '<span style="color:var(--success)">✅ Active AI Provider is configured</span>';
  } else {
    document.getElementById('api-key-status').innerHTML = '';
  }
};

window.saveAllApiKeys = () => {
  const provider = document.getElementById('ai-provider-select').value;
  const geminiKey = document.getElementById('gemini-api-key-input').value.trim();
  const openaiKey = document.getElementById('openai-api-key-input').value.trim();
  const anthropicKey = document.getElementById('anthropic-api-key-input').value.trim();
  const youtubeKey = document.getElementById('youtube-api-key-input').value.trim();
  
  aiService.setConfig({
    provider,
    keys: { gemini: geminiKey, openai: openaiKey, anthropic: anthropicKey }
  });
  
  database.setLocal('youtube_api_key', youtubeKey);

  if (!aiService.hasApiKey()) {
    showToast(`Please enter an API key for ${provider}`, 'error');
    return;
  }

  document.getElementById('api-key-modal').classList.add('hidden');
  updateAiSetupBanner();
  showToast('Configuration saved successfully! 🤖', 'success');
};

function updateAiSetupBanner() {
  const banner = document.getElementById('ai-setup-banner');
  if (banner) {
    banner.style.display = aiService.hasApiKey() ? 'none' : '';
  }
}

// === AI Quick Actions ===
window.aiGenerateQuiz = () => {
  document.getElementById('ai-quiz-modal').classList.remove('hidden');
  document.getElementById('ai-quiz-setup').classList.remove('hidden');
  document.getElementById('ai-quiz-active').classList.add('hidden');
  document.getElementById('ai-quiz-result').classList.add('hidden');
};

let aiQuizState = { questions: [], current: 0, score: 0, answered: false };

window.startAiQuiz = async () => {
  const topic = document.getElementById('ai-quiz-topic').value.trim();
  if (!topic) { showToast('Please enter a quiz topic', 'error'); return; }
  const difficulty = document.getElementById('ai-quiz-difficulty').value;
  const count = parseInt(document.getElementById('ai-quiz-count').value);

  document.getElementById('ai-quiz-generate-btn').classList.add('hidden');
  document.getElementById('ai-quiz-loading').classList.remove('hidden');

  try {
    const questions = await aiService.generateQuiz(topic, difficulty, count);
    aiQuizState = { questions, current: 0, score: 0, answered: false };
    document.getElementById('ai-quiz-setup').classList.add('hidden');
    document.getElementById('ai-quiz-active').classList.remove('hidden');
    renderAiQuestion();
  } catch (err) {
    showToast(err.message || 'Failed to generate quiz', 'error');
  } finally {
    document.getElementById('ai-quiz-generate-btn').classList.remove('hidden');
    document.getElementById('ai-quiz-loading').classList.add('hidden');
  }
};

function renderAiQuestion() {
  const q = aiQuizState.questions[aiQuizState.current];
  const total = aiQuizState.questions.length;
  document.getElementById('ai-quiz-counter').textContent = `Question ${aiQuizState.current + 1} of ${total}`;
  document.getElementById('ai-quiz-score-live').textContent = `Score: ${aiQuizState.score}`;
  document.getElementById('ai-quiz-progress').style.width = ((aiQuizState.current + 1) / total * 100) + '%';
  document.getElementById('ai-quiz-question').textContent = q.q;
  document.getElementById('ai-quiz-next').disabled = true;
  document.getElementById('ai-quiz-next').textContent = aiQuizState.current === total - 1 ? 'See Results' : 'Next →';
  document.getElementById('ai-quiz-explanation').classList.add('hidden');
  const optsEl = document.getElementById('ai-quiz-options');
  optsEl.innerHTML = q.opts.map((o, i) =>
    `<button class="quiz-option" onclick="selectAiOption(${i})" id="aiqopt-${i}">${utils.escHtml(o)}</button>`).join('');
}

window.selectAiOption = (idx) => {
  if (aiQuizState.answered) return;
  aiQuizState.answered = true;
  const q = aiQuizState.questions[aiQuizState.current];
  if (idx === q.ans) aiQuizState.score++;
  q.opts.forEach((_, i) => {
    const btn = document.getElementById('aiqopt-' + i);
    if (!btn) return;
    btn.disabled = true;
    if (i === q.ans) btn.classList.add('correct');
    else if (i === idx && i !== q.ans) btn.classList.add('wrong');
  });
  // Show explanation if available
  if (q.explanation) {
    const expEl = document.getElementById('ai-quiz-explanation');
    expEl.innerHTML = `💡 <strong>Explanation:</strong> ${utils.escHtml(q.explanation)}`;
    expEl.classList.remove('hidden');
  }
  document.getElementById('ai-quiz-next').disabled = false;
};

window.nextAiQuestion = () => {
  if (!aiQuizState.answered) return;
  aiQuizState.current++;
  aiQuizState.answered = false;
  if (aiQuizState.current >= aiQuizState.questions.length) {
    showAiQuizResult();
    return;
  }
  renderAiQuestion();
};

function showAiQuizResult() {
  document.getElementById('ai-quiz-active').classList.add('hidden');
  document.getElementById('ai-quiz-result').classList.remove('hidden');
  const pct = Math.round((aiQuizState.score / aiQuizState.questions.length) * 100);
  document.getElementById('ai-quiz-result-emoji').textContent = pct >= 80 ? '🏆' : pct >= 60 ? '👏' : pct >= 40 ? '📚' : '💪';
  document.getElementById('ai-quiz-result-score').textContent = `${aiQuizState.score}/${aiQuizState.questions.length} (${pct}%)`;
  document.getElementById('ai-quiz-result-msg').textContent = pct >= 80 ? 'Excellent work! You nailed it!' : pct >= 60 ? 'Good job! Keep studying to improve.' : pct >= 40 ? 'Not bad, but review the material for a better score.' : 'Keep practicing! Review the topic and try again.';

  // Save to quiz scores
  database.pushLocal('quiz_scores', { pct, date: new Date().toISOString().split('T')[0], timestamp: new Date().toISOString(), type: 'ai-generated' });
}

window.closeAiQuiz = () => {
  document.getElementById('ai-quiz-modal').classList.add('hidden');
};

// === AI Concept Explainer ===
let aiInputMode = 'concept';

window.aiExplainConcept = () => {
  aiInputMode = 'concept';
  document.getElementById('ai-input-modal-icon').textContent = '💡';
  document.getElementById('ai-input-modal-title').textContent = 'Explain a Concept';
  document.getElementById('ai-input-modal-sub').textContent = "Enter any CS topic and I'll give you a clear, structured explanation";
  document.getElementById('ai-input-label').textContent = 'Concept / Topic';
  document.getElementById('ai-input-field').placeholder = 'e.g. Dynamic Programming, Binary Trees, TCP/IP…';
  document.getElementById('ai-input-extra-fields').innerHTML = '';
  document.getElementById('ai-input-submit').textContent = '💡 Explain';
  document.getElementById('ai-input-modal').classList.remove('hidden');
};

window.aiStudyPlan = () => {
  aiInputMode = 'plan';
  document.getElementById('ai-input-modal-icon').textContent = '🗺️';
  document.getElementById('ai-input-modal-title').textContent = 'Generate Study Plan';
  document.getElementById('ai-input-modal-sub').textContent = "I'll create a personalized study plan based on your goals";
  document.getElementById('ai-input-label').textContent = 'What do you want to learn?';
  document.getElementById('ai-input-field').placeholder = 'e.g. React.js, Machine Learning, System Design…';
  document.getElementById('ai-input-extra-fields').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="form-group"><label class="form-label">Goal</label>
        <select id="ai-plan-goal" class="form-input"><option>Interview Prep</option><option>Project Building</option><option>Exam Preparation</option><option>Career Switch</option><option>Skill Enhancement</option></select>
      </div>
      <div class="form-group"><label class="form-label">Hours/Week</label><input id="ai-plan-hours" class="form-input" type="number" min="1" max="40" value="10"></div>
    </div>`;
  document.getElementById('ai-input-submit').textContent = '🗺️ Generate Plan';
  document.getElementById('ai-input-modal').classList.remove('hidden');
};

window.aiProgressSummary = async () => {
  // Send directly to chat
  document.getElementById('ai-input-modal').classList.add('hidden');
  showPage('ai');
  document.getElementById('chat-input').value = 'Give me a detailed progress report based on my study data';
  window.sendMessage();
};

window.submitAiInput = async () => {
  const field = document.getElementById('ai-input-field').value.trim();
  if (!field) { showToast('Please enter a topic', 'error'); return; }

  document.getElementById('ai-input-modal').classList.add('hidden');
  showPage('ai');

  if (aiInputMode === 'concept') {
    document.getElementById('chat-input').value = `Explain this concept in detail: ${field}`;
  } else if (aiInputMode === 'plan') {
    const goal = document.getElementById('ai-plan-goal')?.value || 'Skill Enhancement';
    const hours = document.getElementById('ai-plan-hours')?.value || '10';
    document.getElementById('chat-input').value = `Create a detailed study plan for learning ${field}. My goal is ${goal} and I can commit ${hours} hours per week. Include phases, milestones, and resources.`;
  }
  window.sendMessage();
};

// === Dark Mode ===
window.toggleDarkMode = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-toggle').textContent = '🌙';
    localStorage.setItem('sl_darkMode', 'false');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-toggle').textContent = '☀️';
    localStorage.setItem('sl_darkMode', 'true');
  }
};

// === Collaborator Filtering (FIXED) ===
window.filterCollabCards = () => {
  const search = document.getElementById('collab-search').value.toLowerCase();
  const skill = document.getElementById('collab-skill-filter').value.toLowerCase();
  const goal = document.getElementById('collab-goal-filter').value.toLowerCase();
  const cards = document.querySelectorAll('.collab-card');
  cards.forEach(card => {
    const name = card.querySelector('.collab-name')?.textContent.toLowerCase() || '';
    const skills = card.querySelector('.collab-skills')?.textContent.toLowerCase() || '';
    const goalText = card.querySelector('.collab-goal')?.textContent.toLowerCase() || '';
    const matchSearch = !search || name.includes(search) || skills.includes(search);
    const matchSkill = !skill || skills.includes(skill.toLowerCase());
    const matchGoal = !goal || goalText.includes(goal.toLowerCase());
    card.style.display = (matchSearch && matchSkill && matchGoal) ? '' : 'none';
  });
};

window.closeProfileModal = (event) => {
  if (event.target === event.currentTarget) {
    document.getElementById('profile-modal').classList.add('hidden');
  }
};

window.toggleLandNav = () => {
  document.getElementById('land-mobile-menu').classList.toggle('active');
};

// Helper to format AI responses (markdown bold → HTML, lists, etc.)
function formatAiResponse(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#1E293B;color:#E2E8F0;padding:12px;border-radius:8px;margin:8px 0;overflow-x:auto;font-size:12px"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--primary-light);color:var(--primary);padding:1px 6px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/^- (.*)/gm, '• $1')
    .replace(/^(\d+)\. (.*)/gm, '$1. $2')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// Initialize AI setup banner on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateAiSetupBanner, 100);
});

