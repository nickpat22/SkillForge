import { state } from '../../core/state.js';
import { plannerService } from '../../backend/services/plannerService.js';
import { quizService } from '../../backend/services/quizService.js';
import { database } from '../../backend/db/database.js';
import { showToast } from '../components/uiHelpers.js';
import { escHtml, getYTId } from '../../core/utils.js';

export function init() {
  // Module page init
}

export function openModuleView(trackKey, stepId) {
  const step = plannerService.getStep(trackKey, stepId);
  if (!step) return;
  state.currentStepData = { trackKey, stepId, step };
  document.getElementById('module-title').textContent = step.title;
  document.getElementById('module-subtitle').textContent = plannerService.getTrack(trackKey).name + ' · ' + step.level + ' · ' + step.duration;
  document.getElementById('module-videos').innerHTML = `
    <div class="module-video-item">
      <iframe class="module-video-embed" src="https://www.youtube.com/embed/${getYTId(step.video.url)}" title="${escHtml(step.video.title)}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>
      <div class="module-video-title">${escHtml(step.video.title)} — ${escHtml(step.video.channel)}</div>
    </div>`;
  document.getElementById('module-content').innerHTML = `
    <h4>About This Module</h4>
    <p>In this module, you will master the following concepts through structured learning, practice exercises, and hands-on application.</p>
    <h4>Topics Covered</h4>
    <ul>${step.topics.map(t => `<li>${escHtml(t)}</li>`).join('')}</ul>
    <h4>Learning Outcomes</h4>
    <p>By the end of this module, you will be able to confidently apply ${escHtml(step.topics[0])} and related skills in real projects.</p>`;
  document.getElementById('learning-guide').innerHTML = `
    <div class="guide-step gs-learn"><span class="guide-icon">📖</span> Learn: Watch video & read notes</div>
    <div class="guide-step gs-practice"><span class="guide-icon">✏️</span> Practice: Solve exercises</div>
    <div class="guide-step gs-master"><span class="guide-icon">🏆</span> Master: Build a mini project</div>`;
  const progress = database.getLocal('ladder_progress') || {};
  const stepProg = progress[trackKey]?.[stepId] || {};
  const dayStatus = stepProg.days || {};
  document.getElementById('module-days').innerHTML = step.days.map(d =>
    `<span class="day-chip ${dayStatus[d] === 'complete' ? 'day-complete' : dayStatus[d] === 'active' ? 'day-active' : 'day-pending'}">${d}</span>`).join('');
  window.showPage('module');
}

export async function backToLadder() {
  if (state.currentStepData) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-planner').classList.add('active');
    document.getElementById('nav-planner').classList.add('active');
    document.getElementById('planner-step-1').classList.add('hidden');
    document.getElementById('planner-step-2').classList.add('hidden');
    document.getElementById('planner-step-3').classList.remove('hidden');
    const { renderLadderSteps } = await import('./plannerPage.js');
    renderLadderSteps(state.currentStepData.trackKey);
  }
}

export function openModuleQuiz() {
  if (!state.currentStepData) return;
  const step = state.currentStepData.step;
  state.miniQuizState.questions = quizService.getModuleQuiz(step);
  state.miniQuizState.current = 0;
  state.miniQuizState.score = 0;
  state.miniQuizState.answered = false;
  state.miniQuizState.stepKey = state.currentStepData.stepId;
  state.miniQuizState.trackKey = state.currentStepData.trackKey;
  document.getElementById('mini-quiz-modal').classList.remove('hidden');
  document.getElementById('mini-quiz-active').classList.remove('hidden');
  document.getElementById('mini-quiz-result').classList.add('hidden');
  renderMiniQuestion();
}

function renderMiniQuestion() {
  const q = state.miniQuizState.questions[state.miniQuizState.current];
  const total = state.miniQuizState.questions.length;
  document.getElementById('mini-quiz-counter').textContent = 'Question ' + (state.miniQuizState.current + 1) + ' of ' + total;
  document.getElementById('mini-quiz-score-live').textContent = 'Score: ' + state.miniQuizState.score;
  document.getElementById('mini-quiz-progress').style.width = ((state.miniQuizState.current + 1) / total * 100) + '%';
  document.getElementById('mini-quiz-question').textContent = q.q;
  document.getElementById('mini-quiz-next').disabled = true;
  document.getElementById('mini-quiz-next').textContent = state.miniQuizState.current === total - 1 ? 'See Results' : 'Next →';
  const optsEl = document.getElementById('mini-quiz-options');
  optsEl.innerHTML = q.opts.map((o, i) =>
    `<button class="quiz-option" onclick="miniSelectOption(${i})" id="mopt-${i}">${escHtml(o)}</button>`).join('');
}

export function miniSelectOption(idx) {
  if (state.miniQuizState.answered) return;
  state.miniQuizState.answered = true;
  const q = state.miniQuizState.questions[state.miniQuizState.current];
  if (idx === q.ans) state.miniQuizState.score++;
  q.opts.forEach((_, i) => {
    const btn = document.getElementById('mopt-' + i);
    if (!btn) return;
    btn.disabled = true;
    if (i === q.ans) btn.classList.add('correct');
    else if (i === idx) btn.classList.add('wrong');
  });
  document.getElementById('mini-quiz-next').disabled = false;
}

export function miniQuizNext() {
  if (!state.miniQuizState.answered) return;
  state.miniQuizState.current++;
  state.miniQuizState.answered = false;
  if (state.miniQuizState.current >= state.miniQuizState.questions.length) { showMiniResult(); return; }
  renderMiniQuestion();
}

function showMiniResult() {
  document.getElementById('mini-quiz-active').classList.add('hidden');
  document.getElementById('mini-quiz-result').classList.remove('hidden');
  const score = state.miniQuizState.score;
  const total = state.miniQuizState.questions.length;
  const passed = score >= Math.ceil(total * 0.67);
  document.getElementById('mini-result-emoji').textContent = passed ? '🎉' : '😔';
  document.getElementById('mini-result-title').textContent = passed ? 'Quiz Passed!' : 'Quiz Failed';
  document.getElementById('mini-result-score').textContent = score + '/' + total;
  document.getElementById('mini-result-msg').textContent = passed
    ? 'Great job! You can now complete this module.'
    : 'You need ' + Math.ceil(total * 0.67) + '/' + total + ' to pass. Review the material and try again.';
  if (passed) {
    plannerService.updateModuleProgress(state.miniQuizState.trackKey, state.miniQuizState.stepKey, true);
    showToast('Module completed! 🏆 Next step unlocked.', 'success');
  }
}

export async function closeMiniQuiz() {
  document.getElementById('mini-quiz-modal').classList.add('hidden');
  if (state.currentStepData) {
    const { renderLadderSteps } = await import('./plannerPage.js');
    renderLadderSteps(state.currentStepData.trackKey);
  }
}