import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { callGroq, parseJsonResponse } from '../lib/groq.js';
import { MODELS, PIPELINE_CONFIG } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SYSTEM_PROMPT = readFileSync(
  join(__dirname, '..', 'prompts', 'trend-synthesizer.md'),
  'utf-8'
);

// ─── Trend Synthesizer ──────────────────────────────────
// Takes Reddit + Twitter + YouTube data and identifies
// cross-platform trends using Groq for deeper reasoning.
// ─────────────────────────────────────────────────────────

// Strip raw scraped text — the LLM only needs structured fields
function slim(posts) {
  return (posts || []).map(({ text, ...rest }) => rest);
}

export async function runTrendSynthesizer(redditData, twitterData, youtubeData) {
  console.log('\n🔮 Trend Synthesizer — Identifying cross-platform themes...\n');

  // Prepare the combined data payload (trimmed — no raw text blobs)
  const combinedData = {
    reddit_posts: slim(redditData),
    twitter_posts: slim(twitterData),
    youtube_videos: slim(youtubeData),
    metadata: {
      reddit_count: (redditData || []).length,
      twitter_count: (twitterData || []).length,
      youtube_count: (youtubeData || []).length,
      analysis_date: new Date().toISOString(),
      requested_trends: PIPELINE_CONFIG.topTrends,
    },
  };

  console.log(
    `  📊 Analyzing ${combinedData.metadata.reddit_count} Reddit posts + ${combinedData.metadata.twitter_count} tweets + ${combinedData.metadata.youtube_count} YouTube videos...\n`
  );

  if (
    combinedData.metadata.reddit_count === 0 &&
    combinedData.metadata.twitter_count === 0 &&
    combinedData.metadata.youtube_count === 0
  ) {
    console.log('  ⚠️  No data to analyze. Returning empty trends.\n');
    return [];
  }

  // Send to Groq for synthesis (with retry)
  const responseText = await callGroq({
    model: MODELS.smart,
    contents: `${SYSTEM_PROMPT}\n\n---\n\nAnalyze this cross-platform data and identify the top ${PIPELINE_CONFIG.topTrends} trending themes:\n\n${JSON.stringify(combinedData, null, 2)}`,
  });

  try {
    const results = parseJsonResponse(responseText);
    console.log(`  ✅ Identified ${results.length} trending themes\n`);
    return results;
  } catch (parseErr) {
    console.error('  ❌ Failed to parse Groq response:', parseErr.message);
    return [];
  }
}

// ─── Self-test: run with sample data ─────────────────────
const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.endsWith('trend-synthesizer.js')) {
  const sampleReddit = [
    {
      title: 'Claude 4 just dropped and it can code entire apps',
      subreddit: 'r/ClaudeAI',
      url: 'https://reddit.com/r/ClaudeAI/example1',
      theme_tags: ['Claude', 'coding', 'AI agents'],
      sentiment: 'excited',
      hook_potential: 8,
    },
    {
      title: 'I replaced my junior dev with an AI agent pipeline',
      subreddit: 'r/programming',
      url: 'https://reddit.com/r/programming/example2',
      theme_tags: ['AI agents', 'automation', 'jobs'],
      sentiment: 'controversial',
      hook_potential: 9,
    },
  ];

  const sampleTwitter = [
    {
      tweet_text: 'Just built an AI agent that does my entire marketing workflow. 10 hours → 10 minutes.',
      author_handle: '@aibuilder',
      url: 'https://x.com/aibuilder/status/example1',
      topic_tags: ['AI agents', 'automation', 'marketing'],
      engagement_estimate: 'high',
      repurpose_potential: 8,
    },
  ];

  runTrendSynthesizer(sampleReddit, sampleTwitter)
    .then((data) => {
      console.log('═══ Trend Synthesizer Output ═══');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      console.error('Trend Synthesizer failed:', err);
      process.exit(1);
    });
}
