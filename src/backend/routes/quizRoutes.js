// src/backend/routes/quizRoutes.js
// AI Quiz Maker — dynamic quiz generation with explanations

const express = require('express');
const router = express.Router();
const { generateQuiz } = require('../services/geminiService');

module.exports = function(pool) {

  // ── Generate a quiz ─────────────────────────────────────────────────────────
  router.post('/generate', async (req, res) => {
    const { topic, difficulty = 'medium', count = 5 } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });
    const safeCount = Math.min(Math.max(Number(count) || 5, 3), 15);
    try {
      const questions = await generateQuiz({ topic, difficulty, count: safeCount });
      res.json({ questions, topic, difficulty, count: safeCount });
    } catch (err) {
      res.status(500).json({ error: 'Quiz generation failed: ' + err.message });
    }
  });

  // ── Save a quiz attempt ─────────────────────────────────────────────────────
  router.post('/attempts', async (req, res) => {
    const { user_email, topic, difficulty, total_questions, score, pct, answers_json } = req.body;
    if (!user_email || !topic) return res.status(400).json({ error: 'Missing required fields' });
    try {
      const [result] = await pool.query(
        `INSERT INTO quiz_attempts (user_email, topic, difficulty, total_questions, score, pct, answers_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_email, topic, difficulty, total_questions, score, pct, JSON.stringify(answers_json || [])]
      );
      // Also save to existing quiz_scores table for analytics
      await pool.query(
        `INSERT INTO quiz_scores (user_email, pct, date, timestamp, type) VALUES (?, ?, CURDATE(), NOW(), ?)`,
        [user_email, pct, `ai-${topic}`]
      );
      res.json({ id: result.insertId, message: 'Quiz attempt saved' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get quiz history for user ───────────────────────────────────────────────
  router.get('/attempts', async (req, res) => {
    const { email, limit = 10 } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    try {
      const [attempts] = await pool.query(
        `SELECT id, topic, difficulty, total_questions, score, pct, created_at
         FROM quiz_attempts WHERE user_email = ?
         ORDER BY created_at DESC LIMIT ?`,
        [email, Number(limit)]
      );
      res.json(attempts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get a specific attempt with full answers ────────────────────────────────
  router.get('/attempts/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [[attempt]] = await pool.query(`SELECT * FROM quiz_attempts WHERE id = ?`, [id]);
      if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
      attempt.answers_json = JSON.parse(attempt.answers_json || '[]');
      res.json(attempt);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
