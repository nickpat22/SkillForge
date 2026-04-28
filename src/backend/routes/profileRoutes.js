// src/backend/routes/profileRoutes.js
// User profiles, public stats, connections (collaborator upgrades)

const express = require('express');
const router = express.Router();

module.exports = function(pool) {

  // ── STATIC routes MUST be before /:email to avoid conflicts ─────────────────

  // ── Get or create my profile ────────────────────────────────────────────────
  router.get('/me', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    try {
      let [[profile]] = await pool.query(`SELECT * FROM user_profiles WHERE user_email = ?`, [email]);
      if (!profile) {
        await pool.query(`INSERT IGNORE INTO user_profiles (user_email) VALUES (?)`, [email]);
        [[profile]] = await pool.query(`SELECT * FROM user_profiles WHERE user_email = ?`, [email]);
      }
      const [[user]] = await pool.query(`SELECT name FROM users WHERE email = ?`, [email]);
      const [[qCount]] = await pool.query(`SELECT COUNT(*) AS c FROM questions WHERE user_email = ?`, [email]);
      const [[aCount]] = await pool.query(`SELECT COUNT(*) AS c FROM answers WHERE user_email = ?`, [email]);
      const [[likeCount]] = await pool.query(`SELECT COUNT(*) AS c FROM answer_likes al JOIN answers a ON al.answer_id = a.id WHERE a.user_email = ?`, [email]);
      res.json({ ...profile, name: user?.name, questions_asked: qCount.c, answers_given: aCount.c, likes_earned: likeCount.c });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Update my profile ───────────────────────────────────────────────────────
  router.post('/me', async (req, res) => {
    const { user_email, college, branch, year, bio, skills, goal, avatar_initials } = req.body;
    if (!user_email) return res.status(400).json({ error: 'user_email required' });
    try {
      const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify((skills || '').split(',').map(s => s.trim()).filter(Boolean));
      await pool.query(`
        INSERT INTO user_profiles (user_email, college, branch, year, bio, skills, goal, avatar_initials)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE college=VALUES(college), branch=VALUES(branch), year=VALUES(year),
          bio=VALUES(bio), skills=VALUES(skills), goal=VALUES(goal), avatar_initials=VALUES(avatar_initials)
      `, [user_email, college, branch, year, bio, skillsJson, goal, avatar_initials]);
      res.json({ message: 'Profile updated' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Send connection request ─────────────────────────────────────────────────
  router.post('/connect', async (req, res) => {
    const { requester_email, recipient_email } = req.body;
    if (!requester_email || !recipient_email) return res.status(400).json({ error: 'Both emails required' });
    try {
      const [[existing]] = await pool.query(
        `SELECT * FROM connections WHERE (requester_email = ? AND recipient_email = ?) OR (requester_email = ? AND recipient_email = ?)`,
        [requester_email, recipient_email, recipient_email, requester_email]
      );
      if (existing) return res.status(400).json({ error: 'Connection already exists', status: existing.status });
      await pool.query(`INSERT INTO connections (requester_email, recipient_email) VALUES (?, ?)`, [requester_email, recipient_email]);
      res.json({ message: 'Connection request sent' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Accept / reject connection ──────────────────────────────────────────────
  router.post('/connect/respond', async (req, res) => {
    const { user_email, requester_email, action } = req.body; // action: 'accept' | 'reject'
    try {
      const status = action === 'accept' ? 'accepted' : 'rejected';
      await pool.query(`UPDATE connections SET status = ? WHERE requester_email = ? AND recipient_email = ?`, [status, requester_email, user_email]);
      res.json({ message: `Connection ${status}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get my connections (MUST be before /:email) ─────────────────────────────
  router.get('/connections/mine', async (req, res) => {
    const { email } = req.query;
    try {
      const [pending] = await pool.query(`
        SELECT c.*, u.name AS requester_name FROM connections c
        JOIN users u ON c.requester_email = u.email
        WHERE c.recipient_email = ? AND c.status = 'pending'
      `, [email]);
      const [accepted] = await pool.query(`
        SELECT c.*, u.name AS other_name,
          CASE WHEN c.requester_email = ? THEN c.recipient_email ELSE c.requester_email END AS other_email
        FROM connections c
        JOIN users u ON (CASE WHEN c.requester_email = ? THEN c.recipient_email ELSE c.requester_email END) = u.email
        WHERE (c.requester_email = ? OR c.recipient_email = ?) AND c.status = 'accepted'
      `, [email, email, email, email]);
      res.json({ pending, accepted });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get all collaborators (with filters) ────────────────────────────────────
  router.get('/', async (req, res) => {
    const { college, branch, year, skill, goal, search, requester_email } = req.query;
    try {
      let query = `
        SELECT up.*, u.name, u.email,
          (SELECT COUNT(*) FROM questions WHERE user_email = u.email) AS questions_asked,
          (SELECT COUNT(*) FROM answers WHERE user_email = u.email) AS answers_given
        FROM user_profiles up
        JOIN users u ON up.user_email = u.email
        WHERE 1=1
      `;
      const params = [];
      if (college) { query += ` AND up.college LIKE ?`; params.push(`%${college}%`); }
      if (branch) { query += ` AND up.branch = ?`; params.push(branch); }
      if (year) { query += ` AND up.year = ?`; params.push(year); }
      if (goal) { query += ` AND up.goal = ?`; params.push(goal); }
      if (skill) { query += ` AND up.skills LIKE ?`; params.push(`%${skill}%`); }
      if (search) { query += ` AND (u.name LIKE ? OR up.college LIKE ? OR up.skills LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
      if (requester_email) { query += ` AND u.email != ?`; params.push(requester_email); }
      query += ` ORDER BY up.reputation DESC LIMIT 50`;

      const [collab] = await pool.query(query, params);

      // If requester, attach connection status
      if (requester_email) {
        const [conns] = await pool.query(`SELECT * FROM connections WHERE (requester_email = ? OR recipient_email = ?)`, [requester_email, requester_email]);
        collab.forEach(c => {
          const conn = conns.find(x => x.requester_email === c.email || x.recipient_email === c.email);
          c.connection_status = conn ? conn.status : 'none';
        });
      }
      res.json(collab);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Public profile by email (MUST be LAST — it's a catch-all /:param) ──────
  router.get('/:email', async (req, res) => {
    const email = decodeURIComponent(req.params.email);
    try {
      const [[user]] = await pool.query(`SELECT name FROM users WHERE email = ?`, [email]);
      if (!user) return res.status(404).json({ error: 'User not found' });
      let [[profile]] = await pool.query(`SELECT * FROM user_profiles WHERE user_email = ?`, [email]);
      if (!profile) profile = {};
      const [[qCount]] = await pool.query(`SELECT COUNT(*) AS c FROM questions WHERE user_email = ?`, [email]);
      const [[aCount]] = await pool.query(`SELECT COUNT(*) AS c FROM answers WHERE user_email = ?`, [email]);
      const [[likeCount]] = await pool.query(`SELECT COUNT(*) AS c FROM answer_likes al JOIN answers a ON al.answer_id = a.id WHERE a.user_email = ?`, [email]);
      // Top answers (most liked)
      const [topAnswers] = await pool.query(`
        SELECT a.body, a.is_accepted, COUNT(al.id) AS like_count, q.title AS question_title, q.id AS question_id
        FROM answers a
        LEFT JOIN answer_likes al ON al.answer_id = a.id
        JOIN questions q ON a.question_id = q.id
        WHERE a.user_email = ?
        GROUP BY a.id ORDER BY like_count DESC LIMIT 5
      `, [email]);

      res.json({ ...profile, name: user.name, email, questions_asked: qCount.c, answers_given: aCount.c, likes_earned: likeCount.c, top_answers: topAnswers });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
