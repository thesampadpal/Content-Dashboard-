import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { PIPELINE_CONFIG } from './config.js';
import { runRedditAgent } from './agents/reddit-agent.js';
import { runTwitterAgent } from './agents/twitter-agent.js';
import { runTrendSynthesizer } from './agents/trend-synthesizer.js';
import { runYouTubeAgent } from './agents/youtube-agent.js';
import { runContentGenerator } from './agents/content-generator.js';
import { runViralityScorer } from './agents/virality-scorer.js';

// ─── Orchestrator ───────────────────────────────────────
// Runs the full content intelligence pipeline:
// Reddit → Twitter → Trend Synthesis → Content Generation
// Saves output to /outputs/ and pretty-prints to terminal.
// ─────────────────────────────────────────────────────────

function banner() {
  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════════╗
║     🚀 VIRAL CONTENT INTELLIGENCE AGENT             ║
║     Multi-source AI content pipeline                 ║
╚══════════════════════════════════════════════════════╝
  `));
  console.log(chalk.dim(`  Started at: ${new Date().toLocaleString()}\n`));
}

function sectionHeader(emoji, title) {
  console.log(
    chalk.bold.white(`\n${'═'.repeat(56)}\n${emoji}  ${title}\n${'═'.repeat(56)}`)
  );
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function printTrends(trends) {
  if (!trends || trends.length === 0) {
    console.log(chalk.yellow('  No trends identified.'));
    return;
  }

  trends.forEach((trend, i) => {
    const scoreColor =
      trend.momentum_score >= 8
        ? chalk.green
        : trend.momentum_score >= 5
          ? chalk.yellow
          : chalk.red;

    console.log(
      `\n  ${chalk.bold.white(`${i + 1}.`)} ${chalk.bold.cyan(trend.name)}`
    );
    console.log(`     ${chalk.dim('Score:')} ${scoreColor(`${trend.momentum_score}/10`)}`);
    console.log(`     ${chalk.dim('Platforms:')} ${(trend.platforms_seen || []).join(', ')}`);
    console.log(`     ${chalk.dim('Description:')} ${trend.description || ''}`);
    console.log(`     ${chalk.dim('Angle:')} ${chalk.italic(trend.content_angle || '')}`);
  });
}

function printContentIdeas(ideas) {
  if (!ideas || ideas.length === 0) {
    console.log(chalk.yellow('  No content ideas generated.'));
    return;
  }

  ideas.forEach((idea, i) => {
    const scoreColor =
      idea.virality_score >= 8
        ? chalk.green
        : idea.virality_score >= 5
          ? chalk.yellow
          : chalk.red;

    const formatBadge = {
      hot_take: chalk.bgRed.white(' HOT TAKE '),
      thread: chalk.bgBlue.white(' THREAD '),
      breakdown: chalk.bgMagenta.white(' BREAKDOWN '),
    };

    console.log(
      `\n  ${chalk.bold.white(`${i + 1}.`)} ${formatBadge[idea.format] || chalk.bgGray.white(` ${idea.format?.toUpperCase()} `)} ${scoreColor(`⚡${idea.virality_score}/10`)}`
    );
    console.log(`     ${chalk.bold.yellow('Hook:')} ${chalk.bold(idea.hook_line || '')}`);
    console.log(`     ${chalk.dim('Theme:')} ${idea.source_theme || ''}`);
    console.log(`     ${chalk.dim('Why it works:')} ${idea.why_it_works || ''}`);

    if (idea.content_outline && Array.isArray(idea.content_outline)) {
      console.log(`     ${chalk.dim('Outline:')}`);
      idea.content_outline.forEach((point) => {
        console.log(`       ${chalk.dim('•')} ${point}`);
      });
    }
  });
}

function printScoredIdeas(ideas) {
  if (!ideas || ideas.length === 0) {
    console.log(chalk.yellow('  No scored ideas to display.'));
    return;
  }

  const predictionColor = {
    viral: chalk.bgGreen.black,
    high: chalk.bgYellow.black,
    medium: chalk.bgBlue.white,
    low: chalk.bgGray.white,
  };

  ideas.forEach((idea, i) => {
    const analysis = idea.virality_analysis;
    if (!analysis) return;

    const badge = predictionColor[analysis.overall_prediction] || chalk.bgGray.white;
    const formatBadge = {
      hot_take: chalk.bgRed.white(' HOT TAKE '),
      thread: chalk.bgBlue.white(' THREAD '),
      breakdown: chalk.bgMagenta.white(' BREAKDOWN '),
    };

    console.log(
      `\n  ${chalk.bold.white(`${i + 1}.`)} ${formatBadge[idea.format] || chalk.bgGray.white(` ${idea.format?.toUpperCase()} `)} ${badge(` ${analysis.overall_prediction?.toUpperCase()} `)} ${chalk.cyan(`avg: ${analysis.score_average}/10`)}`
    );
    console.log(`     ${chalk.bold.yellow('Hook:')} ${chalk.bold(idea.hook_line || '')}`);
    console.log(
      `     ${chalk.dim('Scores:')} hook ${analysis.hook_strength} · gap ${analysis.curiosity_gap} · novelty ${analysis.novelty} · relatable ${analysis.relatability} · share ${analysis.shareability}`
    );
    if (analysis.improvement_tip) {
      console.log(`     ${chalk.dim('💡 Tip:')} ${chalk.italic(analysis.improvement_tip)}`);
    }
  });
}

function validateKeys() {
  const missing = [];
  if (!process.env.EXA_API_KEY)  missing.push('EXA_API_KEY');
  if (!process.env.GROQ_API_KEY) missing.push('GROQ_API_KEY');
  if (missing.length) {
    console.error(chalk.red(`\n❌ Missing required API keys: ${missing.join(', ')}`));
    console.error(chalk.dim('   Add them to your .env file and restart.\n'));
    process.exit(1);
  }
}

async function runPipeline() {
  validateKeys();
  banner();

  const timings = {};
  const report = {
    generated_at: new Date().toISOString(),
    pipeline_version: '1.0.0',
    timings: {},
    reddit_data: [],
    twitter_data: [],
    youtube_data: [],
    trends: [],
    content_ideas: [],
    scored_ideas: [],
  };

  // ── Steps 1–3: Data agents run in parallel ──
  sectionHeader('📡', 'DATA COLLECTION (Reddit + YouTube in parallel)');
  let start = Date.now();

  const [redditResult, twitterResult, youtubeResult] = await Promise.allSettled([
    runRedditAgent(),
    runTwitterAgent(),
    runYouTubeAgent(),
  ]);

  report.reddit_data  = redditResult.status  === 'fulfilled' ? redditResult.value  : [];
  report.twitter_data = twitterResult.status === 'fulfilled' ? twitterResult.value : [];
  report.youtube_data = youtubeResult.status === 'fulfilled' ? youtubeResult.value : [];

  if (redditResult.status  === 'rejected') console.error(chalk.red(`  ❌ Reddit Agent failed: ${redditResult.reason?.message}`));
  if (twitterResult.status === 'rejected') console.error(chalk.red(`  ❌ Twitter Agent failed: ${twitterResult.reason?.message}`));
  if (youtubeResult.status === 'rejected') console.error(chalk.red(`  ❌ YouTube Agent failed: ${youtubeResult.reason?.message}`));

  timings.data_collection = Date.now() - start;
  console.log(chalk.dim(`  ⏱  All data agents completed in ${formatDuration(timings.data_collection)}`));

  // ── Step 4: Trend Synthesizer ──
  sectionHeader('🔮', 'TREND SYNTHESIZER');
  start = Date.now();
  try {
    report.trends = await runTrendSynthesizer(
      report.reddit_data,
      report.twitter_data,
      report.youtube_data
    );
  } catch (err) {
    console.error(chalk.red(`  ❌ Trend Synthesizer failed: ${err.message}`));
    report.trends = [];
  }
  timings.synthesis = Date.now() - start;
  console.log(chalk.dim(`  ⏱  Completed in ${formatDuration(timings.synthesis)}`));

  printTrends(report.trends);

  // ── Step 5: Content Generator ──
  sectionHeader('✍️', 'CONTENT GENERATOR');
  start = Date.now();
  try {
    report.content_ideas = await runContentGenerator(report.trends);
  } catch (err) {
    console.error(chalk.red(`  ❌ Content Generator failed: ${err.message}`));
    report.content_ideas = [];
  }
  timings.content = Date.now() - start;
  console.log(chalk.dim(`  ⏱  Completed in ${formatDuration(timings.content)}`));

  printContentIdeas(report.content_ideas);

  // ── Step 6: Virality Scorer ──
  sectionHeader('⚡', 'VIRALITY SCORER');
  start = Date.now();
  try {
    report.scored_ideas = await runViralityScorer(report.content_ideas);
  } catch (err) {
    console.error(chalk.red(`  ❌ Virality Scorer failed: ${err.message}`));
    report.scored_ideas = report.content_ideas; // fallback to unscored
  }
  timings.virality = Date.now() - start;
  console.log(chalk.dim(`  ⏱  Completed in ${formatDuration(timings.virality)}`));

  printScoredIdeas(report.scored_ideas);

  // ── Save Report ──
  report.timings = timings;
  const totalTime = Object.values(timings).reduce((a, b) => a + b, 0);

  sectionHeader('💾', 'SAVING REPORT');

  const outputDir = PIPELINE_CONFIG.outputDir;
  mkdirSync(outputDir, { recursive: true });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${dateStr}-report.json`;
  const filepath = join(outputDir, filename);

  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(chalk.green(`\n  ✅ Report saved to: ${filepath}`));

  // ── Summary ──
  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════════╗
║     📊 PIPELINE SUMMARY                             ║
╚══════════════════════════════════════════════════════╝
  `));
  const viralCount = report.scored_ideas.filter(
    (r) => r.virality_analysis?.overall_prediction === 'viral'
  ).length;
  const highCount = report.scored_ideas.filter(
    (r) => r.virality_analysis?.overall_prediction === 'high'
  ).length;

  console.log(`  ${chalk.dim('Reddit posts found:')}    ${report.reddit_data.length}`);
  console.log(`  ${chalk.dim('Tweets found:')}          ${report.twitter_data.length}`);
  console.log(`  ${chalk.dim('YouTube videos found:')}  ${report.youtube_data.length}`);
  console.log(`  ${chalk.dim('Trends identified:')}     ${report.trends.length}`);
  console.log(`  ${chalk.dim('Content ideas:')}         ${report.content_ideas.length}`);
  console.log(`  ${chalk.dim('🔥 Viral potential:')}    ${viralCount} viral, ${highCount} high`);
  console.log(`  ${chalk.dim('Total time:')}            ${formatDuration(totalTime)}`);
  console.log(`  ${chalk.dim('Report saved to:')}       ${filepath}`);
  console.log('');

  return report;
}

// ─── CLI Entry Point ─────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('--run')) {
  runPipeline()
    .then(() => {
      console.log(chalk.bold.green('✅ Pipeline complete!\n'));
      process.exit(0);
    })
    .catch((err) => {
      console.error(chalk.bold.red(`\n❌ Pipeline failed: ${err.message}\n`));
      console.error(err.stack);
      process.exit(1);
    });
} else {
  console.log(`
Usage: node orchestrator.js --run

Or use npm:
  npm start          Run the full pipeline
  npm run reddit     Run Reddit agent only
  npm run twitter    Run Twitter agent only
  npm run trends     Run Trend Synthesizer (requires sample data)
  npm run content    Run Content Generator (requires sample data)
  `);
}
