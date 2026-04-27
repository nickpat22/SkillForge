// Pure localStorage database + API Synchronization
const DB = {
  get: k => { try { return JSON.parse(localStorage.getItem('sl_' + k)); } catch(e){ return null; } },
  set: (k, v) => localStorage.setItem('sl_' + k, JSON.stringify(v)),
  push: (k, v) => { const a = DB.get(k) || []; a.push(v); DB.set(k, a); return a; }
};

export const database = {
  async init() { 
    // If user is already logged in on startup, sync from API
    const user = DB.get('currentUser');
    if (user && user.email) {
      await this.syncFromApi();
    }
  },

  async syncFromApi() {
    const user = DB.get('currentUser');
    if (!user || !user.email) return;
    try {
      const emailParam = encodeURIComponent(user.email);
      const [sessionsRes, scoresRes, dataRes] = await Promise.all([
        fetch(`/api/sessions?email=${emailParam}`),
        fetch(`/api/quiz-scores?email=${emailParam}`),
        fetch(`/api/user-data?email=${emailParam}`)
      ]);
      
      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json();
        DB.set('sessions', sessions);
      }
      if (scoresRes.ok) {
        const scores = await scoresRes.json();
        DB.set('quiz_scores', scores);
      }
      if (dataRes.ok) {
        const data = await dataRes.json();
        if (data.planner) DB.set('planner', data.planner);
        if (data.ladder_progress) DB.set('ladder_progress', data.ladder_progress);
      }
    } catch (err) {
      console.error('Failed to sync from API:', err);
    }
  },

  // Local operations
  getLocal: DB.get,
  setLocal: DB.set,
  pushLocal: DB.push,

  // Save helpers (async signature kept for compatibility)
  async saveSession(session) {
    DB.push('sessions', session); // Optimistic local update
    const user = DB.get('currentUser');
    if (user && user.email) {
      session.user_email = user.email;
      fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      }).catch(e => console.error(e));
    }
  },

  async saveQuizScore(score) {
    DB.push('quiz_scores', score);
    const user = DB.get('currentUser');
    if (user && user.email) {
      score.user_email = user.email;
      fetch('/api/quiz-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score)
      }).catch(e => console.error(e));
    }
  },

  async saveUser(user) {
    // Signup and login are handled in app.js with fetch
    DB.set('users', { [user.email]: user });
  },

  async savePlannerData(data) {
    DB.set('planner', data);
    const user = DB.get('currentUser');
    if (user && user.email) {
      fetch('/api/user-data/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, planner: data })
      }).catch(e => console.error(e));
    }
  },

  async saveLadderProgress(progress) {
    DB.set('ladder_progress', progress);
    const user = DB.get('currentUser');
    if (user && user.email) {
      fetch('/api/user-data/ladder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: user.email, ladder_progress: progress })
      }).catch(e => console.error(e));
    }
  }
};