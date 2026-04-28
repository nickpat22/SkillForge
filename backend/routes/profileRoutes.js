// backend/routes/profileRoutes.js
// User profiles, public stats, connections (collaborator upgrades)

import express from 'express';
const router = express.Router();

export default function(pool) {
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
    const { user_email, requester_email, action } = req.body;
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
    if (!email) return res.status(400).json({ error: 'email required' });
    try {
      const [connections] = await pool.query(`
        SELECT c.*, u.name, u.email
        FROM connections c
        JOIN users u ON u.email = CASE
          WHEN c.requester_email = ? THEN c.recipient_email
          ELSE c.requester_email END
        WHERE (c.requester_email = ? OR c.recipient_email = ?) AND c.status = 'accepted'
      `, [email, email, email]);
      res.json(connections);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get public profile by email ─────────────────────────────────────────────
  router.get('/:email', async (req, res) => {
    const { email } = req.params;
    try {
      const [[profile]] = await pool.query(`
        SELECT up.*, u.name, u.email, u.created_at AS user_since
        FROM user_profiles up JOIN users u ON up.user_email = u.email
        WHERE u.email = ?
      `, [email]);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      const [[qCount]] = await pool.query(`SELECT COUNT(*) AS c FROM questions WHERE user_email = ?`, [email]);
      const [[aCount]] = await pool.query(`SELECT COUNT(*) AS c FROM answers WHERE user_email = ?`, [email]);
      res.json({ ...profile, questions_asked: qCount.c, answers_given: aCount.c });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}