// backend/routes/messageRoutes.js
// Direct messaging system

import express from 'express';
const router = express.Router();

export default function(pool) {
  // ── Get my conversations list ───────────────────────────────────────────────
  router.get('/conversations', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    try {
      const [conversations] = await pool.query(`
        SELECT
          other_email,
          u.name AS other_name,
          SUM(unread_flag) AS unread_count
        FROM (
          SELECT
            CASE WHEN m.sender_email = ? THEN m.recipient_email ELSE m.sender_email END AS other_email,
            CASE WHEN m.recipient_email = ? AND m.is_read = 0 THEN 1 ELSE 0 END AS unread_flag
          FROM messages m
          WHERE m.sender_email = ? OR m.recipient_email = ?
        ) AS convs
        JOIN users u ON u.email = convs.other_email
        GROUP BY other_email, u.name
      `, [email, email, email, email]);

      for (const conv of conversations) {
        const [[latest]] = await pool.query(`
          SELECT body, created_at FROM messages
          WHERE (sender_email = ? AND recipient_email = ?)
             OR (sender_email = ? AND recipient_email = ?)
          ORDER BY created_at DESC LIMIT 1
        `, [email, conv.other_email, conv.other_email, email]);
        conv.last_message = latest ? latest.body : '';
        conv.last_at = latest ? latest.created_at : null;
      }

      conversations.sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
      res.json(conversations);
    } catch (err) {
      console.error('Conversations error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Get messages between two users ──────────────────────────────────────────
  router.get('/thread', async (req, res) => {
    const { email, other_email } = req.query;
    if (!email || !other_email) return res.status(400).json({ error: 'Both emails required' });
    try {
      const [messages] = await pool.query(`
        SELECT m.*, u.name AS sender_name
        FROM messages m JOIN users u ON m.sender_email = u.email
        WHERE (m.sender_email = ? AND m.recipient_email = ?)
           OR (m.sender_email = ? AND m.recipient_email = ?)
        ORDER BY m.created_at ASC
      `, [email, other_email, other_email, email]);

      await pool.query(`UPDATE messages SET is_read = 1 WHERE recipient_email = ? AND sender_email = ?`, [email, other_email]);

      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Send a message ──────────────────────────────────────────────────────────
  router.post('/', async (req, res) => {
    const { sender_email, recipient_email, body } = req.body;
    if (!sender_email || !recipient_email || !body) return res.status(400).json({ error: 'Missing fields' });
    try {
      const [[sender]] = await pool.query(`SELECT name FROM users WHERE email = ?`, [sender_email]);
      const [result] = await pool.query(
        `INSERT INTO messages (sender_email, recipient_email, body) VALUES (?, ?, ?)`,
        [sender_email, recipient_email, body]
      );

      // Emit to recipient's socket room
      const io = pool.pool._allConnections?.[0]?.__io || global.io;
      if (io) {
        io.to(recipient_email).emit('new_message', {
          id: result.insertId,
          sender_email,
          sender_name: sender?.name,
          body,
          created_at: new Date()
        });
      }

      res.json({ id: result.insertId, message: 'Message sent' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}