import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  chapter: string;
  topicId: string;
  type: 'mcq' | 'true_false' | 'fill_blank';
  timeEstimate: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Available models - updated for 2026 Gemini API
export const AVAILABLE_MODELS = [
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', desc: 'Fastest & most cost-effective' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', desc: 'Balanced speed and quality' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', desc: 'Stronger reasoning and multimodal support' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', desc: 'Higher capability for complex study tasks' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', desc: 'Newest available Flash model' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Legacy - still supported' },
] as const;

export type ModelId = string;
export type ApiMode = 'auto' | 'gateway' | 'sdk' | 'interactions' | 'direct';

// API Configuration
const API_BASE = 'https://generativelanguage.googleapis.com';
const API_VERSIONS = ['v1beta', 'v1'] as const;

let genAI: GoogleGenerativeAI | null = null;

export const getApiKey = (): string => {
  return localStorage.getItem('gemini_api_key') || '';
};

export const saveApiKey = (key: string): void => {
  localStorage.setItem('gemini_api_key', key);
};

export const getSelectedModel = (): ModelId => {
  return (localStorage.getItem('gemini_model') as ModelId) || 'gemini-3.5-flash-lite';
};

export const setSelectedModel = (model: ModelId): void => {
  localStorage.setItem('gemini_model', model);
};

export const getApiMode = (): ApiMode => {
  return (localStorage.getItem('gemini_api_mode') as ApiMode) || 'auto';
};

export const setApiMode = (mode: ApiMode): void => {
  localStorage.setItem('gemini_api_mode', mode);
};

// Updated validation to accept both AIza (legacy) and AQ (new) formats
export const validateApiKey = (key: string): { valid: boolean; message: string } => {
  if (!key || key.trim() === '') {
    return { valid: false, message: 'API key is required' };
  }
  const trimmed = key.trim();
  
  // New format: starts with AQ (Authentication Key)
  if (trimmed.startsWith('AQ')) {
    if (trimmed.length < 20) {
      return { valid: false, message: 'AQ key seems too short. Expected longer key.' };
    }
    return { valid: true, message: '✅ Valid AQ authentication key (new format)' };
  }
  
  // Legacy format: starts with AIza (Traffic Key)
  if (trimmed.startsWith('AIza')) {
    if (trimmed.length < 35) {
      return { valid: false, message: 'AIza key seems too short. Expected ~39 characters.' };
    }
    return { valid: true, message: '✅ Valid AIza traffic key (legacy format)' };
  }
  
  return { valid: false, message: "Invalid format! Gemini keys start with 'AIza' (legacy) or 'AQ' (new authentication key)" };
};

const initializeGenAI = (): GoogleGenerativeAI => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not set. Please add your Gemini API key in Settings.');
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

export const resetGenAI = (): void => {
  genAI = null;
};

export const getLastProvider = (): string => localStorage.getItem('last_ai_provider') || 'Auto router';

export type GatewayModelOption = { id: string; name: string };

export const getGatewaySetup = async (): Promise<{ gatewayConfigured: boolean; authMode: string; models: GatewayModelOption[] }> => {
  const response = await fetch('/api/ai');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Gateway catalog error ${response.status}`);
  return data;
};

const callServerRouter = async (prompt: string, model: string): Promise<string> => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const attempted = Array.isArray(data?.attempts) ? ` (${data.attempts.map((a: any) => a.provider).join(' → ')})` : '';
    throw new Error(`${data?.error || `Router error ${response.status}`}${attempted}`);
  }
  if (!data?.text) throw new Error('AI router returned no text');
  localStorage.setItem('last_ai_provider', `${data.provider} · ${data.model}`);
  return data.text;
};

// ============ INTERACTIONS API (New primary method) ============
const callInteractionsAPI = async (prompt: string, model: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not set');
  
  const url = `${API_BASE}/v1beta/interactions?api_version=v1beta`;
  
  const body = {
    model: model,
    input: prompt,
    system_instruction: 'You are a helpful AI assistant. Always respond in valid JSON format when asked.',
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Extract text from steps
  if (data.steps && Array.isArray(data.steps)) {
    const textParts = data.steps
      .filter((step: any) => step.type === 'model_output' && step.content)
      .flatMap((step: any) => 
        step.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
      );
    if (textParts.length > 0) {
      return textParts.join('\n');
    }
  }
  
  throw new Error('No text content in response');
};

// ============ DIRECT REST API (Fallback) ============
const callDirectAPI = async (prompt: string, model: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not set');
  
  // Try v1beta first, then v1
  for (const version of API_VERSIONS) {
    try {
      const url = `${API_BASE}/${version}/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404 && version === 'v1beta') continue; // Try v1
        throw new Error(errorData?.error?.message || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
      throw new Error('No text in response');
    } catch (error: any) {
      if (version === 'v1beta') continue;
      throw error;
    }
  }
  throw new Error('All API versions failed');
};

// ============ SDK API (Traditional method) ============
const callSDK = async (prompt: string, model: string): Promise<string> => {
  const ai = initializeGenAI();
  const modelInstance: any = ai.getGenerativeModel({ model });
  const result = await modelInstance.generateContent(prompt);
  const response = result.response;
  return response.text();
};

// ============ UNIFIED GENERATION WITH FALLBACKS ============
const generateWithRetry = async (prompt: string, maxRetries = 2): Promise<string> => {
  const model = getSelectedModel();
  const mode = getApiMode();
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let text: string;

      if (mode === 'auto' || mode === 'gateway') {
        try {
          return await callServerRouter(prompt, model);
        } catch (routerError: any) {
          if (mode === 'gateway' || !getApiKey()) throw routerError;
        }
      }
      
      // Try preferred mode first
      if (mode === 'interactions') {
        try {
          text = await callInteractionsAPI(prompt, model.replace(/^google\//, ''));
        } catch (e: any) {
          // Fallback to direct API
          text = await callDirectAPI(prompt, model.replace(/^google\//, ''));
        }
      } else if (mode === 'direct') {
        text = await callDirectAPI(prompt, model.replace(/^google\//, ''));
      } else {
        // SDK mode (default) - try SDK first, then fallback
        try {
          text = await callSDK(prompt, model.replace(/^google\//, ''));
        } catch (sdkError: any) {
          // SDK failed, try direct REST API
          try {
            text = await callDirectAPI(prompt, model.replace(/^google\//, ''));
          } catch (directError: any) {
            // Try interactions API as last resort
            text = await callInteractionsAPI(prompt, model.replace(/^google\//, ''));
          }
        }
      }
      
      return text;
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw new Error(`AI generation failed after ${maxRetries + 1} attempts: ${error.message || 'Unknown error'}`);
      }
      // Reset SDK on error
      resetGenAI();
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return '';
};

// ============ QUESTION GENERATION ============
const parseJsonResponse = (response: string): any[] => {
  let cleaned = response.trim();
  
  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  // Find the JSON array
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1) {
    cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
  }
  
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Response is not an array');
  return parsed;
};

const mapQuestion = (q: any, idx: number, idPrefix: string, defaultChapter: string): Question => ({
  id: `${idPrefix}-${Date.now()}-${idx}`,
  question: q.question || '',
  options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['', '', '', ''],
  answer: typeof q.answer === 'number' ? Math.min(Math.max(q.answer, 0), 3) : 0,
  explanation: q.explanation || 'Explanation not available.',
  difficulty: (['easy', 'medium', 'hard', 'expert'] as const).includes(q.difficulty) ? q.difficulty : 'medium',
  chapter: q.chapter || defaultChapter,
  topicId: '',
  type: 'mcq',
  timeEstimate: typeof q.timeEstimate === 'number' ? q.timeEstimate : 60
});

export const generateQuestions = async (
  topicName: string,
  standard: number,
  olympiad: string,
  chapters: string[],
  count: number = 25,
  existingQuestions: Question[] = []
): Promise<Question[]> => {
  const existingSample = existingQuestions.length > 0 
    ? `Avoid generating questions similar to these:\n${existingQuestions.slice(0, 3).map(q => `- ${q.question}`).join('\n')}\n\n`
    : '';

  const prompt = `You are an expert Olympiad question creator for ${olympiad} (International ${olympiad === 'IMO' ? 'Mathematics' : 'Science'} Olympiad), Standard ${standard}.

Generate exactly ${count} unique, high-quality MCQ questions for the topic "${topicName}".

${existingSample}
Chapters covered: ${chapters.join(', ')}

IMPORTANT RULES:
- Language must be age-appropriate for Standard ${standard} students (age ${standard === 4 ? '9-10' : '12-13'})
- Each question must have exactly 4 options with ONLY 1 correct answer
- Mix difficulties: 30% easy, 40% medium, 20% hard, 10% expert
- Questions should test conceptual understanding, not just memorization
- Include application-based and reasoning questions
- Each question should be unique and not repetitive

Return ONLY a valid JSON array (no markdown, no code blocks) with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Detailed step-by-step explanation.",
    "difficulty": "easy",
    "chapter": "Chapter name",
    "type": "mcq",
    "timeEstimate": 45
  }
]

The "answer" field is the 0-based index of the correct option (0, 1, 2, or 3).
Difficulty must be one of: "easy", "medium", "hard", "expert"
timeEstimate is in seconds (30 to 180).

Generate ${count} questions now:`;

  try {
    const response = await generateWithRetry(prompt);
    const parsed = parseJsonResponse(response);
    
    return parsed
      .map((q: any, idx: number) => mapQuestion(q, idx, 'q', chapters[0] || topicName))
      .filter((q: Question) => q.question && q.options.length === 4);
    
  } catch (error: any) {
    console.error('Question generation error:', error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

export const generateDailyChallenge = async (
  standard: number,
  topicsList: { name: string; olympiad: string }[]
): Promise<Question[]> => {
  const topicsStr = topicsList.map(t => `${t.name} (${t.olympiad})`).join(', ');
  
  const prompt = `You are an expert Olympiad question creator. Generate exactly 20 mixed-difficulty MCQ questions for a Daily Challenge covering multiple topics for Standard ${standard}.

Topics to cover: ${topicsStr}

Rules:
- Mix 4-5 different topics in this challenge
- Difficulty distribution: 30% easy, 40% medium, 20% hard, 10% expert
- Age-appropriate for Standard ${standard}
- Each question has exactly 4 options with 1 correct answer
- Questions should be fresh and engaging

Return ONLY a valid JSON array:
[
  {
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "answer": 0,
    "explanation": "Step-by-step explanation",
    "difficulty": "medium",
    "chapter": "Topic name",
    "type": "mcq",
    "timeEstimate": 60
  }
]

Generate 20 questions now:`;

  try {
    const response = await generateWithRetry(prompt);
    const parsed = parseJsonResponse(response);
    return parsed
      .map((q: any, idx: number) => mapQuestion(q, idx, 'daily', 'Mixed'))
      .map((q: Question) => ({ ...q, topicId: 'daily-challenge' }))
      .filter((q: Question) => q.question && q.options.length === 4);
  } catch (error: any) {
    throw new Error(`Failed to generate daily challenge: ${error.message}`);
  }
};

export const generateExamQuestions = async (
  topicName: string,
  standard: number,
  olympiad: string,
  chapters: string[],
  count: number = 50
): Promise<Question[]> => {
  const prompt = `Generate ${count} comprehensive exam-level MCQ questions for ${olympiad} Standard ${standard}, Topic: "${topicName}".

Chapters: ${chapters.join(', ')}

Requirements:
- Difficulty: 20% easy, 40% medium, 30% hard, 10% expert
- Include tricky questions that test deep understanding
- Application-based and multi-step reasoning questions
- Olympiad-level difficulty for hard/expert questions

Return ONLY a valid JSON array with structure:
[{"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"...","difficulty":"medium","chapter":"...","type":"mcq","timeEstimate":60}]

Generate ${count} questions:`;

  try {
    const response = await generateWithRetry(prompt);
    const parsed = parseJsonResponse(response);
    return parsed
      .map((q: any, idx: number) => mapQuestion(q, idx, 'exam', chapters[0] || topicName))
      .filter((q: Question) => q.question && q.options.length === 4);
  } catch (error: any) {
    throw new Error(`Failed to generate exam: ${error.message}`);
  }
};

export const askAI = async (question: string, context: string, topicName: string): Promise<string> => {
  const prompt = `You are a friendly AI tutor helping a student with their Olympiad preparation.

Current Topic: ${topicName}
Context: ${context}

Student's Question: ${question}

Provide a helpful, step-by-step explanation. Use simple language appropriate for the student's level. Include:
1. A clear explanation of the concept
2. Step-by-step solution if applicable
3. Tips or tricks to remember
4. Common mistakes to avoid

Keep the response concise but thorough. Use emojis sparingly to make it engaging.`;

  try {
    return await generateWithRetry(prompt);
  } catch (error: any) {
    return `I'm sorry, I couldn't process your question right now. Error: ${error.message}. Please try again later.`;
  }
};

export const generateStudyReport = async (stats: {
  questionsSolved: number;
  accuracy: number;
  weakTopics: string[];
  strongTopics: string[];
  timeSpent: number;
  streak: number;
}): Promise<string> => {
  const prompt = `Generate a short, encouraging daily learning report for a student based on these stats:
- Questions solved today: ${stats.questionsSolved}
- Accuracy: ${stats.accuracy}%
- Weak topics: ${stats.weakTopics.join(', ') || 'None'}
- Strong topics: ${stats.strongTopics.join(', ') || 'None'}
- Time spent: ${Math.floor(stats.timeSpent / 60)} minutes
- Current streak: ${stats.streak} days

Write a 3-4 sentence motivational report that:
1. Celebrates achievements
2. Identifies areas for improvement
3. Gives a specific tip
4. Ends with encouragement

Use a friendly, anime-inspired tone.`;

  try {
    return await generateWithRetry(prompt);
  } catch {
    return `Great work today! You solved ${stats.questionsSolved} questions with ${stats.accuracy}% accuracy. Keep up the streak of ${stats.streak} days! 🌟`;
  }
};

// ============ STORAGE HELPERS ============
export const getStoredQuestions = (topicId: string): Question[] => {
  try {
    const data = localStorage.getItem(`questions_${topicId}`);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.questions || [];
  } catch {
    return [];
  }
};

export const storeQuestions = (topicId: string, questions: Question[]): void => {
  localStorage.setItem(`questions_${topicId}`, JSON.stringify({
    questions,
    lastUpdated: Date.now()
  }));
};

export const shouldRefreshQuestions = (topicId: string, refreshInterval: number = 86400000): boolean => {
  try {
    const data = localStorage.getItem(`questions_${topicId}`);
    if (!data) return true;
    const parsed = JSON.parse(data);
    return Date.now() - (parsed.lastUpdated || 0) > refreshInterval;
  } catch {
    return true;
  }
};

export const getStoredDailyChallenge = (): { questions: Question[]; date: string } | null => {
  try {
    const data = localStorage.getItem('daily_challenge');
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const storeDailyChallenge = (questions: Question[]): void => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('daily_challenge', JSON.stringify({ questions, date: today }));
};

export const isDailyChallengeExpired = (): boolean => {
  const stored = getStoredDailyChallenge();
  if (!stored) return true;
  const today = new Date().toISOString().split('T')[0];
  return stored.date !== today;
};

// ============ API TEST ============
export const testApiConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  const apiKey = getApiKey();
  const mode = getApiMode();
  if (mode === 'auto' || mode === 'gateway') {
    try {
      const response = await callServerRouter('Reply with exactly: {"status":"ok"}', getSelectedModel());
      return { success: true, message: `✅ Server AI router connected via ${getLastProvider()}`, details: { responsePreview: response.substring(0, 100), provider: getLastProvider() } };
    } catch (routerError: any) {
      if (mode === 'gateway' || !apiKey) return { success: false, message: `❌ ${routerError.message}` };
    }
  }
  
  const model = getSelectedModel();
  const details: any = { model, mode, keyPrefix: apiKey.substring(0, 4) + '...' };
  
  try {
    const testPrompt = 'Reply with exactly: {"status":"ok"}';
    let response: string;
    
    if (mode === 'interactions') {
      response = await callInteractionsAPI(testPrompt, model);
    } else if (mode === 'direct') {
      response = await callDirectAPI(testPrompt, model);
    } else {
      try {
        response = await callSDK(testPrompt, model);
      } catch {
        response = await callDirectAPI(testPrompt, model);
      }
    }
    
    details.responseLength = response.length;
    details.responsePreview = response.substring(0, 100);
    return { success: true, message: `✅ Connection successful using ${model} via ${mode} mode`, details };
  } catch (error: any) {
    details.error = error.message;
    return { success: false, message: `❌ Connection failed: ${error.message}`, details };
  }
};
