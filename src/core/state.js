// Global mutable state object
export const state = {
  currentUser: null,
  timerInterval: null,
  timerSeconds: 0,
  timerRunning: false,
  quizState: { current: 0, score: 0, answered: false },
  chartInstances: {},
  currentTrack: null,
  currentStepData: null,
  miniQuizState: { current: 0, score: 0, answered: false, questions: [], stepKey: '', trackKey: '' },
  plannerGenerated: null
};

// Individual named exports for backwards-compatibility with module imports
export let currentUser = null;
export let timerInterval = null;
export let timerSeconds = 0;
export let timerRunning = false;
export let quizState = state.quizState;
export let chartInstances = state.chartInstances;
export let currentTrack = null;
export let currentStepData = null;
export let miniQuizState = state.miniQuizState;
export let plannerGenerated = null;