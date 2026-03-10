import Exa from 'exa-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { callGroq, parseJsonResponse } from '../lib/groq.js';
import {
  EXA_API_KEY,
  MODELS,
  TWITTER_CONFIG,
  daysAgoISO,
} from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SYSTEM_PROMPT = readFileSync(
  join(__dirname, '..', 'prompts', 'twitter-agent.md'),
  'utf-8'
);

// ─── Twitter Agent ───────────────────────────────────────
// Searches Twitter/X for viral AI content using Exa,
// then extracts structured data using Groq.
// Disabled by default — x.com blocks most crawlers.
// ─────────────────────────────────────────────────────────

export async function runTwitterAgent() {
  if (!TWITTER_CONFIG.enabled) {
    console.log('\n🐦 Twitter Agent — Skipped (disabled in config.js)\n');
    return [];
  }

  console.log('\n🐦 Twitter Agent — Scanning X for viral AI tweets...\n');

  const exa = new Exa(EXA_API_KEY);
  const startDate = daysAgoISO(TWITTER_CONFIG.daysBack);
  const allResults = [];

  // Run each query targeting tweets
  for (const query of TWITTER_CONFIG.queries) {
    try {
      console.log(`  🔍 Searching tweets: "${query}"`);

      const response = await exa.search(query, {
        numResults: TWITTER_CONFIG.maxResults,
        includeDomains: ['twitter.com', 'x.com'],
        startPublishedDate: startDate,
        type: 'auto',
        contents: {
          text: { maxCharacters: 1500 },
        },
      });

      if (response.results && response.results.length > 0) {
        console.log(`     ✅ Found ${response.results.length} results`);
        allResults.push(
          ...response.results.map((r) => ({
            title: r.title,
            url: r.url,
            text: r.text?.substring(0, 1200) || '',
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
    console.log('\n  ⚠️  No Twitter results found. Returning empty dataset.\n');
    return [];
  }

  // Deduplicate by URL
  const uniqueResults = [
    ...new Map(allResults.map((r) => [r.url, r])).values(),
  ];

  console.log(
    `\n  📊 Total unique tweets: ${uniqueResults.length}. Extracting structured data...\n`
  );

  // Send to Groq for structured extraction (with retry)
  const responseText = await callGroq({
    model: MODELS.fast,
    contents: `${SYSTEM_PROMPT}\n\n---\n\nHere are the raw Twitter/X search results. Extract structured data from each:\n\n${JSON.stringify(uniqueResults, null, 2)}`,
  });

  try {
    const results = parseJsonResponse(responseText);
    console.log(`  ✅ Extracted ${results.length} structured tweets\n`);
    return results;
  } catch (parseErr) {
    console.error('  ❌ Failed to parse Groq response:', parseErr.message);
    return [];
  }
}

// ─── Self-test: run directly with `node agents/twitter-agent.js` ──
const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.endsWith('twitter-agent.js')) {
  runTwitterAgent()
    .then((data) => {
      console.log('═══ Twitter Agent Output ═══');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      console.error('Twitter Agent failed:', err);
      process.exit(1);
    });
}
