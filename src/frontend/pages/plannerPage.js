import { state } from '../../core/state.js';
import { plannerService } from '../../backend/services/plannerService.js';
import { database } from '../../backend/db/database.js';
import { showToast } from '../components/uiHelpers.js';
import { escHtml } from '../../core/utils.js';

export function init() {
  // Planner page init
}

export function generatePlan() {
  const topic = document.getElementById('plan-topic').value.trim();
  const goal = document.getElementById('plan-goal').value;
  const hours = parseInt(document.getElementById('plan-hours').value) || 10;
  if (!topic) { showToast('Please enter a learning topic', 'error'); return; }
  if (!goal) { showToast('Please select a learning goal', 'error'); return; }
  const plan = plannerService.generateRoadmap(topic, goal, hours);
  state.plannerGenerated = plan;
  document.getElementById('plan-roadmap-title').textContent = '📚 ' + topic + ' — ' + goal;
  document.getElementById('plan-roadmap-meta').textContent = `${hours}h/week · Estimated ${plan.weeks} weeks · Goal: ${goal}`;
  const phases = [
    { name: 'Beginner', cls: 'beginner', icon: '🌱', dur: Math.ceil(plan.weeks * 0.35), topics: getTopicsForPhase(topic, 'beginner') },
    { name: 'Intermediate', cls: 'intermediate', icon: '⚡', dur: Math.ceil(plan.weeks * 0.40), topics: getTopicsForPhase(topic, 'intermediate') },
    { name: 'Advanced', cls: 'advanced', icon: '🏆', dur: Math.floor(plan.weeks * 0.25), topics: getTopicsForPhase(topic, 'advanced') }
  ];
  document.getElementById('plan-roadmap-phases').innerHTML = phases.map(p => `
    <div class="phase-block">
      <div class="phase-header phase-${p.cls}">
        <h3>${p.icon} ${p.name} Phase</h3>
        <span style="font-size:12px;color:#475569;margin-left:8px">${p.dur} weeks</span>
      </div>
      <div class="phase-topics">${p.topics.map(t => `<span class="topic-chip">${escHtml(t)}</span>`).join('')}</div>
    </div>`).join('');
  document.getElementById('planner-step-1').classList.add('hidden');
  document.getElementById('planner-step-2').classList.remove('hidden');
}

function getTopicsForPhase(topic, phase) {
  const map = {
    beginner: ['Fundamentals & Concepts', 'Core Syntax & Tools', 'Basic Problem Solving', 'Environment Setup', 'First Projects'],
    intermediate: ['Advanced Concepts', 'Design Patterns', 'Real-world Applications', 'Performance Optimization', 'Framework Integration'],
    advanced: ['Expert Techniques', 'System Design', 'Capstone Project', 'Interview Preparation', 'Portfolio Building']
  };
  const base = map[phase] || map.beginner;
  return base.map(t => t.replace('Fundamentals', topic + ' Fundamentals').replace('Core', topic + ' Core'));
}

export function startLearningJourney() {
  document.getElementById('planner-step-2').classList.add('hidden');
  document.getElementById('planner-step-3').classList.remove('hidden');
  if (!state.currentTrack) selectTrack('js');
}

export function selectTrack(trackKey) {
  state.currentTrack = trackKey;
  database.setLocal('ladder_track', trackKey);
  const track = plannerService.getTrack(trackKey);
  if (!track) return;
  document.getElementById('planner-step-1').classList.add('hidden');
  document.getElementById('planner-step-2').classList.add('hidden');
  document.getElementById('planner-step-3').classList.remove('hidden');
  document.getElementById('ladder-track-title').textContent = track.icon + ' ' + track.name;
  renderLadderSteps(trackKey);
}

export function renderLadderSteps(trackKey) {
  const track = plannerService.getTrack(trackKey);
  if (!track) return;
  const progress = plannerService.getProgress(trackKey);
  document.getElementById('ladder-progress-label').textContent = progress.completed + ' / ' + progress.total + ' completed';
  document.getElementById('ladder-progress-fill').style.width = (progress.completed / progress.total * 100) + '%';
  const container = document.getElementById('ladder-steps-container');
  container.innerHTML = track.steps.map((step, i) => {
    const isCompleted = database.getLocal('ladder_progress')?.[trackKey]?.[step.id]?.completed;
    const isLocked = i > 0 && !database.getLocal('ladder_progress')?.[trackKey]?.[track.steps[i - 1].id]?.completed;
    return `
      <div class="ladder-step-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}">
        <div class="step-card-header">
          <div class="step-card-title">${isCompleted ? '✅' : isLocked ? '🔒' : '▶'} Step ${i + 1}: ${escHtml(step.title)}</div>
          <div>
            <span class="level-badge level-${step.level}">${step.level}</span>
            <span style="font-size:12px;color:#94A3B8;margin-left:8px">${step.duration}</span>
          </div>
        </div>
        <div class="step-topics">${step.topics.map(t => `<span class="step-topic">${escHtml(t)}</span>`).join('')}</div>
        <div class="step-actions">
          <a href="${step.video.url}" target="_blank" rel="noopener noreferrer" class="btn-small">▶ ${escHtml(step.video.title.substring(0, 30))}...</a>
          ${isCompleted
            ? '<span class="step-complete-chip">✅ Completed</span>'
            : `<button class="btn-primary" onclick="openModuleView('${trackKey}','${step.id}')" style="font-size:13px;padding:8px 14px">Open Module →</button>`
          }
        </div>
      </div>`;
  }).join('');
}