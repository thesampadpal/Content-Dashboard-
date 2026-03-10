import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { callGroq, parseJsonResponse } from '../lib/groq.js';
import { MODELS } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SYSTEM_PROMPT = readFileSync(
    join(__dirname, '..', 'prompts', 'virality-scorer.md'),
    'utf-8'
);

// ─── Virality Scorer ─────────────────────────────────────
// Takes content ideas from the Content Generator and scores
// each one across 5 virality dimensions:
//   hook_strength, curiosity_gap, novelty, relatability, shareability
// Returns enhanced ideas sorted by score_average (desc).
// ─────────────────────────────────────────────────────────

export async function runViralityScorer(contentIdeas) {
    console.log('\n⚡ Virality Scorer — Analyzing scroll-stop potential...\n');

    if (!contentIdeas || contentIdeas.length === 0) {
        console.log('  ⚠️  No content ideas to score.\n');
        return [];
    }

    console.log(`  🔬 Scoring ${contentIdeas.length} content ideas across 5 virality dimensions...\n`);

    const responseText = await callGroq({
        model: MODELS.smart,
        contents: `${SYSTEM_PROMPT}\n\n---\n\nScore the virality potential of each of these content ideas. Be brutally honest. Return ALL original fields plus the virality_analysis object:\n\n${JSON.stringify(contentIdeas, null, 2)}`,
        maxOutputTokens: 8192,
    });

    try {
        const results = parseJsonResponse(responseText);

        // Sort by virality score_average descending
        results.sort(
            (a, b) =>
                (b.virality_analysis?.score_average || 0) -
                (a.virality_analysis?.score_average || 0)
        );

        const viralCount = results.filter(
            (r) => r.virality_analysis?.overall_prediction === 'viral'
        ).length;
        const highCount = results.filter(
            (r) => r.virality_analysis?.overall_prediction === 'high'
        ).length;

        console.log(`  ✅ Scored ${results.length} ideas — 🔥 ${viralCount} viral, ⚡ ${highCount} high potential\n`);
        return results;
    } catch (parseErr) {
        console.error('  ❌ Failed to parse Groq response:', parseErr.message);
        return contentIdeas; // Return original ideas unscored rather than empty
    }
}

// ─── Self-test: run with sample content ideas ────────────
const isMainModule =
    process.argv[1] &&
    fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.endsWith('virality-scorer.js')) {
    const sampleIdeas = [
        {
            format: 'hot_take',
            hook_line: 'I replaced my entire content funnel with 3 AI agents. Here\'s what I learned.',
            source_theme: 'AI agents replacing entire workflows',
            why_it_works: 'Builder credibility + specific claim + curiosity loop',
            virality_score: 8,
            content_outline: [
                'The problem: content took 10 hours/week',
                'Agent 1: Reddit scraper for trend intel',
                'Agent 2: Idea generator with my voice',
                'Agent 3: Virality scorer to filter the bad takes',
                'Result: 45 minutes, better content',
            ],
        },
        {
            format: 'thread',
            hook_line: 'AI is changing the way we work.',
            source_theme: 'AI productivity',
            why_it_works: 'Broad appeal',
            virality_score: 4,
            content_outline: ['Some general AI points', 'More generic statements'],
        },
    ];

    runViralityScorer(sampleIdeas)
        .then((data) => {
            console.log('═══ Virality Scorer Output ═══');
            console.log(JSON.stringify(data, null, 2));
        })
        .catch((err) => {
            console.error('Virality Scorer failed:', err);
            process.exit(1);
        });
}
