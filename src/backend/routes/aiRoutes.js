// src/backend/routes/aiRoutes.js
// AI Assistant — two modes: Website Guide + General Study AI
// All Gemini calls go through backend only (no key exposed to browser)

const express = require('express');
const router = express.Router();
const { generateContent } = require('../services/geminiService');

const WEBSITE_GUIDE_SYSTEM = `You are SkillForge's friendly website assistant. SkillForge is a student learning platform with these features:
- Dashboard: Shows study stats, effectiveness, consistency, best quiz score
- Session Tracker: Log study sessions with topic, duration, focus level, time slot
- Assessment: 10-question CS quiz covering DSA, OOP, Networking fundamentals
- Analytics: Charts showing weekly activity, slot-based effectiveness, quiz score trends
- AI Insights: Personalized recommendations based on study data
- Study Planner: AI-generated roadmaps + structured JavaScript/Python/DSA learning tracks
- Collaborators: Find study partners by college, branch, skill, goal
- Q&A Hub: Ask academic/coding questions, answer others, earn reputation
- Messages: Direct message connected collaborators
- AI Assistant: That's me! I help guide you through the platform and answer study questions.

Help users navigate and use SkillForge effectively. Be concise, friendly, and helpful.`;

const STUDY_AI_SYSTEM = `You are an expert CS and academic tutor. Help students understand:
- Programming concepts (JavaScript, Python, Java, C++, etc.)
- Data Structures & Algorithms
- System Design
- Database concepts
- Web Development
- Machine Learning basics
- Interview preparation
- Academic subjects

Format code with proper markdown code blocks. Be accurate, detailed, and educational.`;

module.exports = function(pool) {

  // ── Chat endpoint ───────────────────────────────────────────────────────────
  router.post('/chat', async (req, res) => {
    const { user_email, message, mode = 'study', history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const systemInstruction = mode === 'guide' ? WEBSITE_GUIDE_SYSTEM : STUDY_AI_SYSTEM;

    // Build context from history (last 6 exchanges)
    const recentHistory = history.slice(-6);
    let contextPrompt = '';
    if (recentHistory.length > 0) {
      contextPrompt = recentHistory.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n') + '\n';
    }
    const fullPrompt = contextPrompt + `User: ${message}`;

    try {
      const aiResponse = await generateContent(fullPrompt, systemInstruction);

      // Save to chat history in DB if user logged in
      if (user_email && pool) {
        await pool.query(
          `INSERT INTO chat_history (user_email, mode, user_message, ai_response) VALUES (?, ?, ?, ?)`,
          [user_email, mode, message, aiResponse]
        ).catch(() => {}); // silently fail if table missing
      }

      res.json({ response: aiResponse, mode });
    } catch (err) {
      res.status(500).json({ error: 'AI service error: ' + err.message });
    }
  });

  // ── Get chat history ────────────────────────────────────────────────────────
  router.get('/history', async (req, res) => {
    const { email, mode, limit = 20 } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    try {
      let query = `SELECT * FROM chat_history WHERE user_email = ?`;
      const params = [email];
      if (mode) { query += ` AND mode = ?`; params.push(mode); }
      query += ` ORDER BY created_at DESC LIMIT ?`;
      params.push(Number(limit));
      const [history] = await pool.query(query, params);
      res.json(history.reverse());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Clear chat history ──────────────────────────────────────────────────────
  router.delete('/history', async (req, res) => {
    const { email, mode } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    try {
      let query = `DELETE FROM chat_history WHERE user_email = ?`;
      const params = [email];
      if (mode) { query += ` AND mode = ?`; params.push(mode); }
      await pool.query(query, params);
      res.json({ message: 'History cleared' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Quick AI explain (for Q&A helper) ──────────────────────────────────────
  router.post('/explain', async (req, res) => {
    const { concept } = req.body;
    if (!concept) return res.status(400).json({ error: 'concept required' });
    try {
      const prompt = `Explain "${concept}" clearly for a CS student. Use examples and code if helpful. Keep it concise (under 300 words).`;
      const response = await generateContent(prompt, STUDY_AI_SYSTEM);
      res.json({ response });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
