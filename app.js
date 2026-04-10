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
window.handleLogin = () => {
  const username = document.getElementById('login-username').value.trim();
  if (!username) { showToast('Please enter a username', 'error'); return; }
  state.currentUser = username;
  database.setLocal('currentUser', username);
  document.getElementById('login-modal').classList.add('hidden');
  showApp();
  showToast('Welcome, ' + username + '!', 'success');
  dashboardPage.refreshDashboard();
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

window.handleSignup = (event) => {
  event.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-pass').value.trim();
  if (!name || !email || !pass) { showToast('Please fill all fields', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
  state.currentUser = { name, email };
  database.setLocal('currentUser', { name, email });
  document.getElementById('login-modal').classList.add('hidden');
  showApp();
  showToast('Account created! Welcome, ' + name + '!', 'success');
  refreshDashboard();
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

// AI Assistant
window.sendMessage = () => {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  const chat = document.getElementById('chat-messages');
  chat.innerHTML += `<div class="chat-msg user-msg"><div class="chat-avatar user-avatar">👤</div><div class="chat-bubble user-bubble">${utils.escHtml(msg)}</div></div>`;
  input.value = '';
  setTimeout(() => {
    chat.innerHTML += `<div class="chat-msg bot-msg"><div class="chat-avatar bot-avatar">🤖</div><div class="chat-bubble bot-bubble">Thanks for your message: "${utils.escHtml(msg)}". How can I help with your learning?</div></div>`;
    chat.scrollTop = chat.scrollHeight;
  }, 1000);
};

window.sendQuickMessage = (msg) => {
  document.getElementById('chat-input').value = msg;
  window.sendMessage();
};

window.filterCollabCards = () => {
  const search = document.getElementById('collab-search').value.toLowerCase();
  const skill = document.getElementById('collab-skill-filter').value;
  const goal = document.getElementById('collab-goal-filter').value;
  console.log('Filtering collaborators:', search, skill, goal);
};

window.closeProfileModal = (event) => {
  if (event.target === event.currentTarget) {
    document.getElementById('profile-modal').classList.add('hidden');
  }
};

window.toggleLandNav = () => {
  document.getElementById('land-mobile-menu').classList.toggle('active');
};
