// backend/services/geminiService.js
// Gemini AI Service for quiz generation and AI chat

import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function generateContent(prompt, systemInstruction = '') {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.9,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  } catch (error) {
    console.error('Gemini service error:', error.message);
    throw error;
  }
}

export async function generateQuiz({ topic, difficulty, count }) {
  const prompt = `Generate ${count} multiple choice questions about "${topic}" at ${difficulty} difficulty.
  
Return ONLY valid JSON array (no markdown, no explanation) with this exact structure:
[{
  "id": 1,
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Brief explanation of the correct answer"
}]`;

  const response = await generateContent(prompt, 'You are a quiz generator. Output only valid JSON.');
  
  try {
    return JSON.parse(response);
  } catch {
    throw new Error('Failed to parse quiz questions');
  }
}

export default { generateContent, generateQuiz };