require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const qaRoutes = require('./src/backend/routes/qaRoutes');
const profileRoutes = require('./src/backend/routes/profileRoutes');
const messageRoutes = require('./src/backend/routes/messageRoutes');
const aiRoutes = require('./src/backend/routes/aiRoutes');
const quizRoutes = require('./src/backend/routes/quizRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Socket.IO — room-per-user ────────────────────────────────────────────────
io.on('connection', (socket) => {
  socket.on('join', (userEmail) => {
    socket.join(userEmail);
  });
  socket.on('disconnect', () => {});
});
// Expose io so routes can emit
app.set('io', io);

// ── MySQL Pool ───────────────────────────────────────────────────────────────
let pool;

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });
  const dbName = process.env.DB_NAME || 'skillforge_db';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.end();

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // ── Existing tables ──────────────────────────────────────────────────────
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    topic VARCHAR(255),
    duration INT,
    date DATE,
    slot VARCHAR(50),
    focus INT,
    effectiveness FLOAT DEFAULT 0,
    quizScore FLOAT DEFAULT 0,
    timestamp DATETIME,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS quiz_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    pct INT,
    date DATE,
    timestamp DATETIME,
    type VARCHAR(100),
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS user_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    planner JSON,
    ladder_progress JSON,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  // ── New tables ────────────────────────────────────────────────────────────
  await pool.query(`CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    college VARCHAR(255),
    branch VARCHAR(100),
    year INT,
    bio TEXT,
    skills JSON,
    goal VARCHAR(100),
    avatar_initials VARCHAR(3),
    reputation INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    status ENUM('pending','accepted','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_conn (requester_email, recipient_email),
    FOREIGN KEY (requester_email) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (recipient_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    tags JSON,
    branch VARCHAR(100),
    topic VARCHAR(255),
    is_answered TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_accepted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS answer_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    answer_id INT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (answer_id, user_email),
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_email) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (recipient_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    mode VARCHAR(20) DEFAULT 'study',
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'medium',
    total_questions INT,
    score INT,
    pct INT,
    answers_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
  )`);

  console.log('✅ MySQL Database initialized (all tables ready)');
}

// ── Boot everything ──────────────────────────────────────────────────────────
async function boot() {
  try {
    // 1. Initialize database and pool FIRST
    await initializeDatabase();

    // 2. Mount API routes (pool is ready now)
    app.use('/api/qa', qaRoutes(pool));
    app.use('/api/profiles', profileRoutes(pool));
    app.use('/api/messages', messageRoutes(pool, io));
    app.use('/api/ai', aiRoutes(pool));
    app.use('/api/quiz', quizRoutes(pool));

    // 3. Existing Auth Routes
    app.post('/api/auth/signup', async (req, res) => {
      const { name, email, password } = req.body;
      try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });
        await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
        await pool.query('INSERT INTO user_data (user_email, planner, ladder_progress) VALUES (?, "{}", "{}")', [email]);
        await pool.query('INSERT IGNORE INTO user_profiles (user_email) VALUES (?)', [email]);
        res.json({ message: 'User created successfully', user: { name, email } });
      } catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;
      try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'User not found' });
        if (users[0].password !== password) return res.status(401).json({ error: 'Incorrect password' });
        res.json({ message: 'Login successful', user: { name: users[0].name, email: users[0].email } });
      } catch (error) { res.status(500).json({ error: error.message }); }
    });

    // 4. Existing Data Routes
    app.get('/api/sessions', async (req, res) => {
      const { email } = req.query;
      try { const [sessions] = await pool.query('SELECT * FROM sessions WHERE user_email = ?', [email]); res.json(sessions); }
      catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.post('/api/sessions', async (req, res) => {
      const { user_email, topic, duration, date, slot, focus, timestamp, effectiveness, quizScore } = req.body;
      try {
        await pool.query('INSERT INTO sessions (user_email, topic, duration, date, slot, focus, timestamp, effectiveness, quizScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [user_email, topic, duration, date, slot, focus, timestamp, effectiveness || 0, quizScore || 0]);
        const [sessions] = await pool.query('SELECT * FROM sessions WHERE user_email = ?', [user_email]);
        res.json(sessions);
      } catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.get('/api/quiz-scores', async (req, res) => {
      const { email } = req.query;
      try { const [scores] = await pool.query('SELECT * FROM quiz_scores WHERE user_email = ?', [email]); res.json(scores); }
      catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.post('/api/quiz-scores', async (req, res) => {
      const { user_email, pct, date, timestamp, type } = req.body;
      try {
        await pool.query('INSERT INTO quiz_scores (user_email, pct, date, timestamp, type) VALUES (?, ?, ?, ?, ?)', [user_email, pct, date, timestamp, type]);
        const [scores] = await pool.query('SELECT * FROM quiz_scores WHERE user_email = ?', [user_email]);
        res.json(scores);
      } catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.get('/api/user-data', async (req, res) => {
      const { email } = req.query;
      try {
        const [data] = await pool.query('SELECT planner, ladder_progress FROM user_data WHERE user_email = ?', [email]);
        res.json(data.length > 0 ? data[0] : { planner: {}, ladder_progress: {} });
      } catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.post('/api/user-data/planner', async (req, res) => {
      const { user_email, planner } = req.body;
      try { await pool.query('UPDATE user_data SET planner = ? WHERE user_email = ?', [JSON.stringify(planner), user_email]); res.json({ success: true }); }
      catch (error) { res.status(500).json({ error: error.message }); }
    });

    app.post('/api/user-data/ladder', async (req, res) => {
      const { user_email, ladder_progress } = req.body;
      try { await pool.query('UPDATE user_data SET ladder_progress = ? WHERE user_email = ?', [JSON.stringify(ladder_progress), user_email]); res.json({ success: true }); }
      catch (error) { res.status(500).json({ error: error.message }); }
    });

    // 5. SPA Fallback — MUST be the LAST route registered
    app.use((req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

    // 6. Start listening AFTER everything is ready
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`\n🚀 SkillForge running at http://localhost:${PORT}`);
      console.log(`   Socket.IO enabled for real-time messaging`);
    });

  } catch (error) {
    console.error('❌ Failed to initialize:', error.message);
    process.exit(1);
  }
}

boot();
