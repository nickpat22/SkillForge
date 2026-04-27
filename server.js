require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// MySQL connection setup
let pool;
async function initializeDatabase() {
  try {
    // Connect to MySQL server first (without database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'skillforge_db';
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();

    // Create a pool for the database
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Initialize tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        topic VARCHAR(255),
        duration INT,
        date DATE,
        slot VARCHAR(50),
        focus INT,
        timestamp DATETIME,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        pct INT,
        date DATE,
        timestamp DATETIME,
        type VARCHAR(50),
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) UNIQUE NOT NULL,
        planner JSON,
        ladder_progress JSON,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      )
    `);

    console.log('✅ MySQL Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize MySQL Database:', error.message);
    console.error('Make sure your MySQL server is running and credentials in .env are correct.');
  }
}

// API Routes

// --- Authentication ---
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    // Initialize user_data
    await pool.query('INSERT INTO user_data (user_email, planner, ladder_progress) VALUES (?, "{}", "{}")', [email]);
    res.json({ message: 'User created successfully', user: { name, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = users[0];
    // In a real app, use bcrypt to compare passwords
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Sessions ---
app.get('/api/sessions', async (req, res) => {
  const { email } = req.query;
  try {
    const [sessions] = await pool.query('SELECT * FROM sessions WHERE user_email = ?', [email]);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  const { user_email, topic, duration, date, slot, focus, timestamp } = req.body;
  try {
    await pool.query(
      'INSERT INTO sessions (user_email, topic, duration, date, slot, focus, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_email, topic, duration, date, slot, focus, timestamp]
    );
    const [sessions] = await pool.query('SELECT * FROM sessions WHERE user_email = ?', [user_email]);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Quiz Scores ---
app.get('/api/quiz-scores', async (req, res) => {
  const { email } = req.query;
  try {
    const [scores] = await pool.query('SELECT * FROM quiz_scores WHERE user_email = ?', [email]);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quiz-scores', async (req, res) => {
  const { user_email, pct, date, timestamp, type } = req.body;
  try {
    await pool.query(
      'INSERT INTO quiz_scores (user_email, pct, date, timestamp, type) VALUES (?, ?, ?, ?, ?)',
      [user_email, pct, date, timestamp, type]
    );
    const [scores] = await pool.query('SELECT * FROM quiz_scores WHERE user_email = ?', [user_email]);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- User Data (Planner, Ladder Progress) ---
app.get('/api/user-data', async (req, res) => {
  const { email } = req.query;
  try {
    const [data] = await pool.query('SELECT planner, ladder_progress FROM user_data WHERE user_email = ?', [email]);
    if (data.length > 0) {
      res.json(data[0]);
    } else {
      res.json({ planner: {}, ladder_progress: {} });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user-data/planner', async (req, res) => {
  const { user_email, planner } = req.body;
  try {
    await pool.query('UPDATE user_data SET planner = ? WHERE user_email = ?', [JSON.stringify(planner), user_email]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user-data/ladder', async (req, res) => {
  const { user_email, ladder_progress } = req.body;
  try {
    await pool.query('UPDATE user_data SET ladder_progress = ? WHERE user_email = ?', [JSON.stringify(ladder_progress), user_email]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback for SPA routing if needed
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`Serving SkillForge at http://localhost:${PORT}`);
  await initializeDatabase();
});
