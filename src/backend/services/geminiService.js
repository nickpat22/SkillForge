// src/backend/services/geminiService.js
// Centralized Gemini API client with Pollinations fallback

const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Call Gemini API. Falls back to Pollinations if no key.
 * @param {string} prompt
 * @param {string} systemInstruction
 * @returns {Promise<string>}
 */
async function generateContent(prompt, systemInstruction = '') {
  if (GEMINI_API_KEY) {
    return callGemini(prompt, systemInstruction);
  }
  return callPollinations(systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt);
}

function callGemini(prompt, systemInstruction) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      ...(systemInstruction && {
        systemInstruction: { parts: [{ text: systemInstruction }] }
      }),
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    });

    const url = new URL(GEMINI_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) resolve(text);
          else reject(new Error('No content from Gemini: ' + data));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function callPollinations(prompt) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(prompt);
    const options = {
      hostname: 'text.pollinations.ai',
      path: '/' + encoded,
      method: 'GET',
      headers: { 'User-Agent': 'SkillForge/1.0' }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data || 'No response from AI.'));
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Generate a JSON quiz using AI.
 * Returns parsed array of question objects.
 */
async function generateQuiz({ topic, difficulty, count }) {
  const prompt = `Generate a JSON array of ${count} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level.

Return ONLY valid JSON, no markdown, no explanation. Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of why the answer is correct."
  }
]

"correct" is the 0-based index of the correct option.`;

  const raw = await generateContent(prompt);
  // Strip markdown code fences if any
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('AI did not return valid JSON array');
  return JSON.parse(cleaned.substring(start, end + 1));
}

module.exports = { generateContent, generateQuiz };
