// AI Service — Multi-Provider AI Integration for SkillForge
import { database } from '../db/database.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'; // Note: Usually requires backend proxy for CORS

// Store the API keys in localStorage so users can set it once
export const aiService = {
  getConfig() {
    const defaultConfig = { 
      provider: 'gemini', 
      keys: { 
        gemini: 'AIzaSyDFMJ7a0nP_7DRcIEPA5EnHZecvAGbVA0w', 
        openai: '', 
        anthropic: '' 
      } 
    };
    const saved = database.getLocal('ai_config');
    // Merge saved config over default so the hardcoded key applies if empty
    return {
      provider: saved?.provider || defaultConfig.provider,
      keys: {
        gemini: saved?.keys?.gemini || defaultConfig.keys.gemini,
        openai: saved?.keys?.openai || defaultConfig.keys.openai,
        anthropic: saved?.keys?.anthropic || defaultConfig.keys.anthropic
      }
    };
  },

  setConfig(config) {
    database.setLocal('ai_config', config);
  },

  hasApiKey() {
    const config = this.getConfig();
    return !!config.keys[config.provider];
  },

  // Build context from user's study data
  _buildUserContext() {
    const sessions = database.getLocal('sessions') || [];
    const scores = database.getLocal('quiz_scores') || [];
    const user = database.getLocal('currentUser');
    const name = (user && user.name) ? user.name : (typeof user === 'string' ? user : 'Student');

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((a, s) => a + (s.duration || 0), 0);
    const avgFocus = sessions.length
      ? (sessions.reduce((a, s) => a + (s.focus || 3), 0) / sessions.length).toFixed(1)
      : 'N/A';
    const topics = [...new Set(sessions.map(s => s.topic).filter(Boolean))];
    const recentScores = scores.slice(-5).map(s => s.pct + '%').join(', ') || 'None yet';
    const bestScore = scores.length ? Math.max(...scores.map(s => s.pct)) + '%' : 'N/A';

    // Determine weak areas from slots
    const slotData = {};
    sessions.forEach(s => {
      if (!slotData[s.slot]) slotData[s.slot] = { count: 0, totalEff: 0 };
      slotData[s.slot].count++;
      slotData[s.slot].totalEff += s.effectiveness || 0;
    });

    let contextStr = `Student Name: ${name}\n`;
    contextStr += `Total Study Sessions: ${totalSessions}\n`;
    contextStr += `Total Study Time: ${totalMinutes} minutes\n`;
    contextStr += `Average Focus Rating: ${avgFocus}/5\n`;
    contextStr += `Topics Studied: ${topics.length ? topics.join(', ') : 'None yet'}\n`;
    contextStr += `Recent Quiz Scores: ${recentScores}\n`;
    contextStr += `Best Quiz Score: ${bestScore}\n`;

    if (Object.keys(slotData).length) {
      contextStr += `\nStudy Slot Breakdown:\n`;
      for (const [slot, data] of Object.entries(slotData)) {
        const avgEff = (data.totalEff / data.count * 100).toFixed(1);
        contextStr += `  - ${slot}: ${data.count} sessions, avg effectiveness ${avgEff}%\n`;
      }
    }

    return contextStr;
  },

  // Core Multi-Provider API call
  async _callAI(prompt, systemInstruction) {
    const config = this.getConfig();
    const provider = config.provider;
    const key = config.keys[provider];

    if (!key) throw new Error('NO_API_KEY');

    try {
      if (provider === 'gemini') {
        const body = {
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.8, topP: 0.95, maxOutputTokens: 2048 }
        };
        const resp = await fetch(`${GEMINI_API_URL}?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          if (resp.status === 400 || resp.status === 403) throw new Error('INVALID_API_KEY');
          throw new Error(`Gemini Error: ${resp.status}`);
        }
        const data = await resp.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      } 
      
      else if (provider === 'openai') {
        const resp = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ],
            temperature: 0.8
          })
        });
        if (!resp.ok) {
          if (resp.status === 401) throw new Error('INVALID_API_KEY');
          throw new Error(`OpenAI Error: ${resp.status}`);
        }
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || 'No response generated.';
      }
      
      else if (provider === 'anthropic') {
        // Anthropic blocks browser CORS by default. This requires a backend proxy in production.
        const resp = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true' // Try to allow if supported
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2048,
            system: systemInstruction,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (!resp.ok) {
          if (resp.status === 401) throw new Error('INVALID_API_KEY');
          throw new Error(`Anthropic Error: ${resp.status}`);
        }
        const data = await resp.json();
        return data.content?.[0]?.text || 'No response generated.';
      }
    } catch (e) {
      if (e.message.includes('NO_API_KEY') || e.message.includes('INVALID_API_KEY')) throw e;
      throw new Error(`Failed to contact ${provider}. (${e.message})`);
    }
  },

  // ===== CHAT ASSISTANT =====
  async chat(userMessage, conversationHistory = []) {
    const context = this._buildUserContext();
    const systemPrompt = `You are SkillForge AI, a friendly and expert study assistant embedded in a learning platform called SkillForge. Your role is to:

1. Help students study more effectively by giving personalized advice
2. Explain technical concepts clearly (CS, programming, DSA, etc.)
3. Motivate and encourage consistent study habits
4. Analyze study patterns and suggest improvements
5. Generate practice questions when asked

Here is the student's current data:
${context}

Guidelines:
- Be concise but helpful (aim for 2-4 paragraphs max)
- Use emojis sparingly to be friendly 🎯
- Reference the student's actual data when giving advice
- If they ask about a technical topic, explain it clearly with examples
- If they ask for study tips, personalize based on their data
- Format your responses with **bold** for key terms and bullet points for lists
- Don't use markdown headers (no # symbols)`;

    // Build conversation context
    let fullPrompt = '';
    if (conversationHistory.length > 0) {
      fullPrompt += 'Previous conversation:\n';
      conversationHistory.slice(-6).forEach(msg => {
        fullPrompt += `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.text}\n`;
      });
      fullPrompt += '\n';
    }
    fullPrompt += `Student: ${userMessage}`;

    return this._callAI(fullPrompt, systemPrompt);
  },

  // ===== AI QUIZ GENERATION =====
  async generateQuiz(topic, difficulty = 'medium', count = 5) {
    const systemPrompt = `You are a quiz generator for a learning platform. Generate quiz questions in valid JSON format ONLY. No markdown, no code blocks, just pure JSON.`;

    const prompt = `Generate exactly ${count} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty level for computer science students.

Return ONLY a JSON array in this exact format (no markdown, no code fences):
[
  {
    "q": "Question text here?",
    "opts": ["Option A", "Option B", "Option C", "Option D"],
    "ans": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

Rules:
- Each question must have exactly 4 options
- "ans" is the 0-based index of the correct option
- Questions should be clear and educational
- Include a brief explanation for each answer
- Difficulty: ${difficulty} (easy = fundamentals, medium = application, hard = edge cases & advanced)`;

    const response = await this._callAI(prompt, systemPrompt);

    // Parse JSON from response (handle markdown code blocks if present)
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```(?:json)?\n?/g, '').trim();
    }

    try {
      const questions = JSON.parse(jsonStr);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid quiz format');
      }
      // Validate structure
      return questions.filter(q =>
        q.q && Array.isArray(q.opts) && q.opts.length === 4 && typeof q.ans === 'number'
      ).slice(0, count);
    } catch (e) {
      console.error('Failed to parse AI quiz:', e, jsonStr);
      throw new Error('Failed to generate quiz. Please try again.');
    }
  },

  // ===== AI CONCEPT EXPLAINER =====
  async explainConcept(concept) {
    const systemPrompt = `You are a Computer Science tutor in a learning platform called SkillForge. Explain concepts clearly and concisely for students. Use simple language, real-world analogies, and code examples when helpful.`;

    const prompt = `Explain the following concept to a CS student in a clear, structured way:

"${concept}"

Structure your explanation like:
1. **What it is** — One-line definition
2. **How it works** — Core mechanism (2-3 sentences)
3. **Real-world analogy** — Something relatable
4. **Code example** — A short, practical example (if applicable)
5. **Key takeaway** — One sentence to remember

Keep it concise and educational. Use **bold** for key terms.`;

    return this._callAI(prompt, systemPrompt);
  },

  // ===== AI STUDY PLAN =====
  async generateStudyPlan(topic, goal, hoursPerWeek, currentLevel = 'beginner') {
    const context = this._buildUserContext();
    const systemPrompt = `You are a study plan architect in SkillForge. Create personalized, actionable study plans. Return your plan in a structured format with clear phases and milestones.`;

    const prompt = `Create a personalized study plan for a student with this profile:
${context}

Study Plan Request:
- Topic: ${topic}
- Goal: ${goal}
- Available time: ${hoursPerWeek} hours/week
- Current level: ${currentLevel}

Generate a structured study plan with 3 phases (Beginner → Intermediate → Advanced).
For each phase include:
- Phase name and estimated duration (weeks)
- 4-6 specific topics to cover
- 2-3 recommended resources or exercises
- A milestone/checkpoint to complete before moving on

Format as a clear, readable plan using **bold** for headers and bullet points for items. Keep it practical and achievable.`;

    return this._callAI(prompt, systemPrompt);
  },

  // ===== AI PROGRESS SUMMARY =====
  async getProgressSummary() {
    const context = this._buildUserContext();
    const systemPrompt = `You are a data analyst for a learning platform. Provide a brief, encouraging summary of the student's learning progress with actionable next steps.`;

    const prompt = `Analyze this student's learning data and provide a brief progress summary:

${context}

Include:
1. **Overall Assessment** — How are they doing? (1-2 sentences)
2. **Strengths** — What they're doing well (2-3 points)
3. **Areas to Improve** — Specific, actionable suggestions (2-3 points)
4. **Next Steps** — What they should focus on this week (2-3 items)

Be encouraging but honest. Use the actual data to support your points.`;

    return this._callAI(prompt, systemPrompt);
  }
};
