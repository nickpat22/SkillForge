// Pure localStorage database — no Firebase dependency
const DB = {
  get: k => { try { return JSON.parse(localStorage.getItem('sl_' + k)); } catch(e){ return null; } },
  set: (k, v) => localStorage.setItem('sl_' + k, JSON.stringify(v)),
  push: (k, v) => { const a = DB.get(k) || []; a.push(v); DB.set(k, a); return a; }
};

export const database = {
  init() { /* no-op, localStorage always ready */ },

  // Local operations
  getLocal: DB.get,
  setLocal: DB.set,
  pushLocal: DB.push,

  // Save helpers (async signature kept for compatibility)
  async saveSession(session) {
    DB.push('sessions', session);
  },

  async saveQuizScore(score) {
    DB.push('quiz_scores', score);
  },

  async saveUser(user) {
    const users = DB.get('users') || {};
    users[user.email] = user;
    DB.set('users', users);
  },

  async savePlannerData(data) {
    DB.set('planner', data);
  },

  async saveLadderProgress(progress) {
    DB.set('ladder_progress', progress);
  }
};