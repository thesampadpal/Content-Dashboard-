import Exa from 'exa-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { callGroq, parseJsonResponse } from '../lib/groq.js';
import {
  EXA_API_KEY,
  MODELS,
  YOUTUBE_CONFIG,
  daysAgoISO,
} from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SYSTEM_PROMPT = readFileSync(
  join(__dirname, '..', 'prompts', 'youtube-agent.md'),
  'utf-8'
);

// ─── YouTube Agent ───────────────────────────────────────
// Searches YouTube for viral AI content using Exa, then
// extracts structured data using Groq.
// ─────────────────────────────────────────────────────────

export async function runYouTubeAgent() {
  console.log('\n▶️  YouTube Agent — Scanning YouTube for AI agent tutorials & demos...\n');

  const exa = new Exa(EXA_API_KEY);
  const startDate = daysAgoISO(YOUTUBE_CONFIG.daysBack);
  const allResults = [];

  // Run each query against YouTube
  for (const query of YOUTUBE_CONFIG.queries) {
    try {
      console.log(`  🔍 Searching: "${query}"`);

      const response = await exa.search(query, {
        numResults: YOUTUBE_CONFIG.maxResults,
        includeDomains: ['youtube.com'],
        startPublishedDate: startDate,
        type: 'auto',
        contents: {
          text: { maxCharacters: 1500 }, // Snag video description/transcript parts
        },
      });

      if (response.results && response.results.length > 0) {
        console.log(`     ✅ Found ${response.results.length} results`);
        allResults.push(
          ...response.results.map((r) => ({
            title: r.title,
            url: r.url,
            text: r.text?.substring(0, 1000) || '',
            publishedDate: r.publishedDate,
            author: r.author || null,
          }))
        );
      } else {
        console.log(`     ⚠️  No results`);
      }
    } catch (err) {
      console.error(`     ❌ Error searching "${query}":`, err.message);
    }
    
    await new Promise(r => setTimeout(r, 200));
  }

  if (allResults.length === 0) {
    console.log('\n  ⚠️  No YouTube results found. Returning empty dataset.\n');
    return [];
  }

  // Deduplicate by URL
  // YouTube videos often have different query params (?v=...), try to normalize them based on ID if possible,
  // but simpler to deduplicate by raw URL since Exa usually provides standard youtube.com/watch?v=... URLs.
  const uniqueResults = [
    ...new Map(allResults.map((r) => [r.url, r])).values(),
  ];

  console.log(
    `\n  📊 Total unique videos: ${uniqueResults.length}. Extracting structured data...\n`
  );

  // Send to Groq for structured extraction
  const responseText = await callGroq({
    model: MODELS.fast,
    contents: `${SYSTEM_PROMPT}\n\n---\n\nHere are the raw YouTube search results. Extract structured data from each:\n\n${JSON.stringify(uniqueResults, null, 2)}`,
  });

  try {
    const results = parseJsonResponse(responseText);
    console.log(`  ✅ Extracted ${results.length} structured YouTube videos\n`);
    return results;
  } catch (parseErr) {
    console.error('  ❌ Failed to parse Groq response:', parseErr.message);
    return [];
  }
}

// ─── Self-test: run directly with `node agents/youtube-agent.js` ──
const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.endsWith('youtube-agent.js')) {
  runYouTubeAgent()
    .then((data) => {
      console.log('═══ YouTube Agent Output ═══');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      console.error('YouTube Agent failed:', err);
      process.exit(1);
    });
}
