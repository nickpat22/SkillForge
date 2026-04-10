import { state } from '../../core/state.js';
import { quizService } from '../../backend/services/quizService.js';
import { showToast } from '../components/uiHelpers.js';

export function initQuiz() {
  state.quizState.current = 0;
  state.quizState.score = 0;
  state.quizState.answered = false;
  const active = document.getElementById('quiz-active');
  const result = document.getElementById('quiz-result');
  if (active) active.classList.remove('hidden');
  if (result) result.classList.add('hidden');
  renderQuestion();
}

function renderQuestion() {
  const questions = quizService.getQuestions();
  const q = questions[state.quizState.current];
  const total = questions.length;
  document.getElementById('quiz-counter').textContent = 'Question ' + (state.quizState.current + 1) + ' of ' + total;
  document.getElementById('quiz-score-live').textContent = 'Score: ' + state.quizState.score;
  document.getElementById('quiz-progress').style.width = ((state.quizState.current + 1) / total * 100) + '%';
  document.getElementById('quiz-question').textContent = q.q;
  document.getElementById('quiz-next-btn').disabled = true;
  document.getElementById('quiz-next-btn').textContent = state.quizState.current === total - 1 ? 'See Results' : 'Next →';
  const optsEl = document.getElementById('quiz-options');
  optsEl.innerHTML = q.opts.map((o, i) =>
    `<button class="quiz-option" onclick="selectOption(${i})" id="quiz-opt-${i}">${o}</button>`).join('');
}

export function selectOption(idx) {
  if (state.quizState.answered) return;
  state.quizState.answered = true;
  const questions = quizService.getQuestions();
  const q = questions[state.quizState.current];
  if (quizService.evaluateAnswer(state.quizState.current, idx)) state.quizState.score++;
  q.opts.forEach((_, i) => {
    const btn = document.getElementById('quiz-opt-' + i);
    if (!btn) return;
    btn.disabled = true;
    if (i === q.ans) btn.classList.add('correct');
    else if (i === idx) btn.classList.add('wrong');
  });
  document.getElementById('quiz-next-btn').disabled = false;
}

export function nextQuestion() {
  if (!state.quizState.answered) return;
  state.quizState.current++;
  state.quizState.answered = false;
  const questions = quizService.getQuestions();
  if (state.quizState.current >= questions.length) { showQuizResult(); return; }
  renderQuestion();
}

export async function showQuizResult() {
  document.getElementById('quiz-active').classList.add('hidden');
  document.getElementById('quiz-result').classList.remove('hidden');
  const questions = quizService.getQuestions();
  const pct = quizService.calculateScore(state.quizState.score, questions.length);
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : pct >= 40 ? '😊' : '📚';
  const msg = pct >= 80 ? 'Outstanding performance!' : pct >= 60 ? 'Great work!' : pct >= 40 ? 'Keep practicing!' : 'Review the material and try again.';
  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-score').textContent = pct + '%';
  document.getElementById('result-pct').textContent = pct + '%';
  document.getElementById('result-sub').textContent = msg;
  document.getElementById('result-correct').textContent = state.quizState.score;
  document.getElementById('result-wrong').textContent = questions.length - state.quizState.score;
}

export function init() {
  // Assessment page init
}

export function retakeQuiz() { initQuiz(); }

export async function saveQuizScore() {
  const questions = quizService.getQuestions();
  const pct = quizService.calculateScore(state.quizState.score, questions.length);
  await quizService.saveScore(pct);
  showToast('Score saved: ' + pct + '%! 💾', 'success');
}