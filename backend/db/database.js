// backend/db/database.js
// MySQL Database Connection Pool

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export async function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'skillforge_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  return pool;
}

export async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  const dbName = process.env.DB_NAME || 'skillforge_db';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.query(`USE \`${dbName}\`;`);
  
  // Create tables
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      email VARCHAR(255) PRIMARY KEY,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_email VARCHAR(255) PRIMARY KEY,
      college VARCHAR(255),
      branch VARCHAR(100),
      year INT,
      bio TEXT,
      skills JSON,
      goal TEXT,
      avatar_initials VARCHAR(10),
      reputation INT DEFAULT 0,
      FOREIGN KEY (user_email) REFERENCES users(email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255),
      title VARCHAR(500) NOT NULL,
      topic VARCHAR(255),
      branch VARCHAR(100),
      body TEXT,
      is_answered BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_email) REFERENCES users(email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT,
      user_email VARCHAR(255),
      body TEXT NOT NULL,
      is_accepted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (user_email) REFERENCES users(email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS answer_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      answer_id INT,
      user_email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (answer_id) REFERENCES answers(id),
      FOREIGN KEY (user_email) REFERENCES users(email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_email VARCHAR(255),
      recipient_email VARCHAR(255),
      body TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_email) REFERENCES users(email),
      FOREIGN KEY (recipient_email) REFERENCES users(email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS connections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requester_email VARCHAR(255),
      recipient_email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_email) REFERENCES users(email),
      FOREIGN KEY (recipient_email) REFERENCES users(email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255),
      topic VARCHAR(255),
      difficulty VARCHAR(50),
      total_questions INT,
      score INT,
      pct INT,
      answers_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_email) REFERENCES users(email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS quiz_scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255),
      pct INT,
      date DATE,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      type VARCHAR(100),
      FOREIGN KEY (user_email) REFERENCES users(email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255),
      mode VARCHAR(50),
      user_message TEXT,
      ai_response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_email) REFERENCES users(email)
    )
  `);

  await connection.end();
  console.log('✅ Database initialized');
}

export default { getPool, initializeDatabase };