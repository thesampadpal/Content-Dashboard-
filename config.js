import dotenv from 'dotenv';
dotenv.config();

// ─── API Keys ────────────────────────────────────────────
export const EXA_API_KEY = process.env.EXA_API_KEY;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ─── Model Config ────────────────────────────────────────
// Using Groq models for insanely fast processing
export const MODELS = {
  fast: 'llama-3.1-8b-instant',    // Reddit/Twitter data extraction
  smart: 'llama-3.3-70b-versatile',  // Trend synthesis & content generation
};

// ─── Reddit Config ───────────────────────────────────────
export const REDDIT_CONFIG = {
  subreddits: [
    'r/artificial',
    'r/MachineLearning',
    'r/LocalLLaMA',
    'r/ChatGPT',
    'r/OpenAI',
    'r/ClaudeAI',
    'r/singularity',
    'r/entrepreneur',
    'r/startups',
    'r/SaaS',
    'r/aiagents',
    'r/automation',
    'r/ai',
    'r/programming',
  ],
  queries: [
    'viral AI agents discussion',
    'AI breakthrough top post',
    'LLM Claude GPT new feature announcement',
    'AI automation tool trending',
    'AI startup building in public',
  ],
  maxResults: 10,
  daysBack: 7,
};

// ─── Twitter Config ──────────────────────────────────────
export const TWITTER_CONFIG = {
  enabled: false, // x.com blocks Exa crawling — flip to true if a working source is available
  queries: [
    'AI agents breakthrough',
    'LLM new capability announcement',
    'Claude GPT Gemini hot take',
    'AI tools for developers viral',
    'AI agent framework open source',
    'building AI agents tips',
  ],
  maxResults: 10,
  daysBack: 7,
};

// ─── YouTube Config ──────────────────────────────────────
export const YOUTUBE_CONFIG = {
  queries: [
    'AI agents tutorial 2025',
    'AI automation breakthrough',
    'Claude Code demo',
    'Local LLM agents',
    'AI workflows builder',
  ],
  maxResults: 5,
  daysBack: 14,
};

// ─── General Config ──────────────────────────────────────
export const PIPELINE_CONFIG = {
  topTrends: 5,          // Number of trends to synthesize
  ideasPerTrend: 3,      // Content ideas per trend
  outputDir: 'outputs',  // Where to save reports
};

// ─── Helper: get date N days ago in ISO format ───────────
export function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0] + 'T00:00:00.000Z';
}
