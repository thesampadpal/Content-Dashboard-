import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { callGroq, parseJsonResponse } from '../lib/groq.js';
import { MODELS, PIPELINE_CONFIG } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SYSTEM_PROMPT = readFileSync(
  join(__dirname, '..', 'prompts', 'content-generator.md'),
  'utf-8'
);

// ─── Content Generator ──────────────────────────────────
// Takes trending themes and generates viral content ideas
// using Groq with the founder's voice.
// ─────────────────────────────────────────────────────────

export async function runContentGenerator(trends) {
  console.log('\n✍️  Content Generator — Creating viral content ideas...\n');

  if (!trends || trends.length === 0) {
    console.log('  ⚠️  No trends to generate content for.\n');
    return [];
  }

  console.log(
    `  📝 Generating ${PIPELINE_CONFIG.ideasPerTrend} ideas for each of ${trends.length} themes...\n`
  );

  // Send all trends at once for Groq to generate content (with retry)
  const responseText = await callGroq({
    model: MODELS.smart,
    contents: `${SYSTEM_PROMPT}\n\n---\n\nHere are the top trending themes. For each one, generate ${PIPELINE_CONFIG.ideasPerTrend} content ideas (hot take, thread, breakdown):\n\n${JSON.stringify(trends, null, 2)}`,
    maxOutputTokens: 8192,
  });

  try {
    const results = parseJsonResponse(responseText);

    // Sort by virality score (highest first)
    results.sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0));

    console.log(`  ✅ Generated ${results.length} content ideas\n`);
    return results;
  } catch (parseErr) {
    console.error('  ❌ Failed to parse Groq response:', parseErr.message);
    return [];
  }
}

// ─── Self-test: run with sample trends ───────────────────
const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.endsWith('content-generator.js')) {
  const sampleTrends = [
    {
      name: 'AI agents replacing entire workflows',
      description:
        'Multiple builders are reporting replacing multi-hour workflows with AI agent pipelines, achieving 10-100x speedups.',
      momentum_score: 9,
      content_angle:
        'Share your own experience building agent workflows — what worked and what broke.',
      platforms_seen: ['reddit', 'twitter'],
    },
    {
      name: 'Open-source AI models catching up to GPT-4',
      description:
        'Local LLM community is buzzing about new open models matching proprietary ones on benchmarks.',
      momentum_score: 8,
      content_angle:
        'Compare specific tasks where open models win vs lose against proprietary ones.',
      platforms_seen: ['reddit'],
    },
  ];

  runContentGenerator(sampleTrends)
    .then((data) => {
      console.log('═══ Content Generator Output ═══');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      console.error('Content Generator failed:', err);
      process.exit(1);
    });
}
