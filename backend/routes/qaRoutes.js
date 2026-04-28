// backend/routes/qaRoutes.js
// Q&A Hub — Brainly-style question & answer system

import express from 'express';
const router = express.Router();

export default function(pool) {
  // ── Search MUST be before /:id to avoid conflict ───────────────────────────
  router.get('/search/q', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
      const [results] = await pool.query(`
        SELECT q.id, q.title, q.topic, q.branch, q.created_at,
          u.name AS author_name,
          (SELECT COUNT(*) FROM answers ans WHERE ans.question_id = q.id) AS answer_count
        FROM questions q JOIN users u ON q.user_email = u.email
        WHERE q.title LIKE ? OR q.topic LIKE ? OR q.branch LIKE ?
        ORDER BY q.created_at DESC LIMIT 20
      `, [`%${q}%`, `%${q}%`, `%${q}%`]);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Like / unlike an answer (BEFORE /:id route) ────────────────────────────
  router.post('/answers/:answerId/like', async (req, res) => {
    const { answerId } = req.params;
    const { user_email } = req.body;
    if (!user_email) return res.status(400).json({ error: 'Missing user_email' });
    try {
      const [[existing]] = await pool.query(
        `SELECT id FROM answer_likes WHERE answer_id = ? AND user_email = ?`, [answerId, user_email]
      );
      if (existing) {
        await pool.query(`DELETE FROM answer_likes WHERE answer_id = ? AND user_email = ?`, [answerId, user_email]);
        res.json({ liked: false });
      } else {
        await pool.query(`INSERT INTO answer_likes (answer_id, user_email) VALUES (?, ?)`, [answerId, user_email]);
        const [[ans]] = await pool.query(`SELECT user_email FROM answers WHERE id = ?`, [answerId]);
        if (ans) {
          await pool.query(`UPDATE user_profiles SET reputation = reputation + 1 WHERE user_email = ?`, [ans.user_email]);
        }
        res.json({ liked: true });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Accept an answer (BEFORE /:id route) ───────────────────────────────────
  router.post('/answers/:answerId/accept', async (req, res) => {
    const { answerId } = req.params;
    const { user_email } = req.body;
    try {
      const [[ans]] = await pool.query(`SELECT * FROM answers WHERE id = ?`, [answerId]);
      if (!ans) return res.status(404).json({ error: 'Answer not found' });
      const [[q]] = await pool.query(`SELECT * FROM questions WHERE id = ?`, [ans.question_id]);
      if (!q || q.user_email !== user_email) return res.status(403).json({ error: 'Only question author can accept' });
      await pool.query(`UPDATE answers SET is_accepted = 0 WHERE question_id = ?`, [ans.question_id]);
      await pool.query(`UPDATE answers SET is_accepted = 1 WHERE id = ?`, [answerId]);
      await pool.query(`UPDATE questions SET is_answered = 1 WHERE id = ?`, [ans.question_id]);
      await pool.query(`UPDATE user_profiles SET reputation = reputation + 10 WHERE user_email = ?`, [ans.user_email]);
      res.json({ message: 'Answer accepted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get questions feed ──────────────────────────────────────────────────────
  router.get('/', async (req, res) => {
    const { tab = 'recent', branch, limit = 20, offset = 0 } = req.query;
    try {
      let query = `
        SELECT q.*,
          u.name AS author_name,
          (SELECT COUNT(*) FROM answers ans WHERE ans.question_id = q.id) AS answer_count,
          (SELECT COUNT(*) FROM answer_likes al JOIN answers a ON al.answer_id = a.id WHERE a.question_id = q.id) AS like_count
        FROM questions q JOIN users u ON q.user_email = u.email
      `;
      const params = [];
      if (branch) {
        query += ` WHERE q.branch = ?`;
        params.push(branch);
      }
      query += ` ORDER BY q.created_at DESC LIMIT ? OFFSET ?`;
      params.push(Number(limit), Number(offset));
      const [results] = await pool.query(query, params);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get single question with answers ───────────────────────────────────────
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [[question]] = await pool.query(`
        SELECT q.*, u.name AS author_name
        FROM questions q JOIN users u ON q.user_email = u.email
        WHERE q.id = ?
      `, [id]);
      if (!question) return res.status(404).json({ error: 'Question not found' });
      const [answers] = await pool.query(`
        SELECT a.*, u.name AS author_name,
          (SELECT COUNT(*) FROM answer_likes WHERE answer_id = a.id) AS like_count
        FROM answers a JOIN users u ON a.user_email = u.email
        WHERE a.question_id = ?
        ORDER BY a.is_accepted DESC, a.created_at ASC
      `, [id]);
      res.json({ ...question, answers });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Post a new question ────────────────────────────────────────────────────
  router.post('/', async (req, res) => {
    const { user_email, title, topic, branch, body } = req.body;
    if (!user_email || !title) return res.status(400).json({ error: 'user_email and title required' });
    try {
      const [result] = await pool.query(
        `INSERT INTO questions (user_email, title, topic, branch, body) VALUES (?, ?, ?, ?, ?)`,
        [user_email, title, topic, branch, body]
      );
      res.json({ id: result.insertId, message: 'Question created' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Post an answer ─────────────────────────────────────────────────────────
  router.post('/:id/answers', async (req, res) => {
    const { id } = req.params;
    const { user_email, body } = req.body;
    if (!user_email || !body) return res.status(400).json({ error: 'user_email and body required' });
    try {
      const [result] = await pool.query(
        `INSERT INTO answers (question_id, user_email, body) VALUES (?, ?, ?)`,
        [id, user_email, body]
      );
      res.json({ id: result.insertId, message: 'Answer posted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}