import { state } from '../../core/state.js';
import { plannerService } from '../../backend/services/plannerService.js';
import { aiService } from '../../backend/services/aiService.js';
import { database } from '../../backend/db/database.js';
import { showToast } from '../components/uiHelpers.js';
import { escHtml } from '../../core/utils.js';

export function init() {
  // Planner page init
}

export async function generatePlan() {
  const topic = document.getElementById('plan-topic').value.trim();
  const goal = document.getElementById('plan-goal').value;
  const hours = parseInt(document.getElementById('plan-hours').value) || 10;
  if (!topic) { showToast('Please enter a learning topic', 'error'); return; }
  if (!goal) { showToast('Please select a learning goal', 'error'); return; }

  const btn = document.getElementById('plan-generate-btn');
  const loading = document.getElementById('plan-loading');
  if (btn) btn.classList.add('hidden');
  if (loading) loading.classList.remove('hidden');

  try {
    const planText = await aiService.generateStudyPlan(topic, goal, hours);
    state.plannerGenerated = planText;
    document.getElementById('plan-roadmap-title').textContent = '📚 ' + topic + ' — ' + goal;
    document.getElementById('plan-roadmap-meta').textContent = `${hours}h/week · Goal: ${goal}`;
    
    // Format Markdown to HTML
    const formattedHtml = planText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)/gm, '• $1')
      .replace(/^(\d+)\. (.*)/gm, '<strong>$1.</strong> $2')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    document.getElementById('plan-roadmap-phases').innerHTML = `
      <div style="padding:20px;background:var(--surface);border-radius:12px;border:1px solid var(--border);color:var(--text);font-size:15px;line-height:1.7;margin-bottom:20px">
        ${formattedHtml}
      </div>`;
      
    document.getElementById('planner-step-1').classList.add('hidden');
    document.getElementById('planner-step-2').classList.remove('hidden');
  } catch (err) {
    showToast('Error generating roadmap: ' + err.message, 'error');
  } finally {
    if (btn) btn.classList.remove('hidden');
    if (loading) loading.classList.add('hidden');
  }
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