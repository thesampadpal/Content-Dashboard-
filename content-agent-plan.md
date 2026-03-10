# Viral Content Intelligence Agent — Full Plan

## What This Agent Does

A multi-source content repurposing agent that:
1. **Monitors** Reddit, Twitter/X, and YouTube for viral AI content
2. **Analyzes** what makes content scroll-stopping (hooks, format, engagement patterns)
3. **Synthesizes** trends across platforms
4. **Generates** original content ideas tailored to your voice and audience
5. **Outputs** a ready-to-review content brief with ranked ideas

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                    │
│   (coordinates all sub-agents, assembles final output)  │
└──────┬──────────┬──────────┬──────────┬─────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  REDDIT      TWITTER     YOUTUBE    TREND
  AGENT       AGENT       AGENT      SYNTHESIZER
       │          │          │          │
       └──────────┴──────────┴──────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  CONTENT GENERATOR    │
              │  (repurpose + ideate) │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  VIRALITY SCORER      │
              │  (hook analysis,      │
              │   scroll-stop rating) │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   CONTENT BRIEF UI    │
              │  (ranked ideas,       │
              │   ready to post)      │
              └───────────────────────┘
```

---

## Sub-Agent Breakdown

### 1. Reddit Agent
- **Sources**: r/artificial, r/MachineLearning, r/LocalLLaMA, r/ChatGPT, r/OpenAI, r/ClaudeAI, r/singularity, r/entrepreneur, r/startups, r/SaaS, r/aiagents, r/automation, r/ai, r/programming
- **Signals**: upvote count, comment velocity, awards, post age vs engagement ratio
- **Extracts**: post title, top comments, key discussion themes, sentiment

### 2. Twitter/X Agent
- **Sources**: Exa tweet search on AI agents, LLMs, Claude, GPT, AI tools
- **Signals**: retweet count, reply count, quote count, impressions
- **Extracts**: viral tweets, thread starters, hot takes, announcement posts, articles

### 3. YouTube Agent
- **Sources**: Search for recent AI tutorials, demos, breakdowns
- **Signals**: view count, like ratio, comment count, upload recency
- **Extracts**: video titles, thumbnails (described), hook structure, description

### 4. Trend Synthesizer
- Cross-references signals across all 3 platforms
- Identifies: emerging topics, recurring themes, format patterns
- Scores content by: novelty, engagement potential, relevance to AI agents space

### 5. Content Generator
- Takes top 5-10 viral pieces as input
- Repurposes for Twitter threads, short-form posts, long-form takes
- Matches your voice: technical founder, building in public, AI-native
- Formats: hot take, thread, breakdown, personal story, prediction

### 6. Virality Scorer
- Hook analysis (first 5 words test)
- Scroll-stop factors: curiosity gap, controversy, utility, relatability
- Format scoring: lists, threads, visuals suggestions
- Engagement prediction: low / medium / high

---

## Content Output Format

Each idea includes:
- **Source**: where the trend was spotted
- **Virality Score**: 1-10
- **Content Type**: thread / post / take / breakdown
- **Draft Hook**: first line/tweet
- **Angle**: your unique spin
- **Why it works**: scroll-stop analysis

---

## Optimized Claude Code Prompt

```
You are building a multi-agent content intelligence system for a solo founder 
building in public in the AI agents space. The founder is 18 years old, technical, 
and wants to grow on Twitter/X to become a thought leader in AI agents.

Build the following system using Claude as the AI backbone:

## SYSTEM: Viral Content Intelligence Agent

### Goal
Monitor Reddit, Twitter/X, and YouTube for viral content in the AI/AI agents space.
Analyze what makes content scroll-stopping. Generate original, repurposed content 
ideas the founder can post to grow their Twitter audience.

### Architecture
Build as a multi-agent pipeline with these components:

**1. REDDIT SCRAPER AGENT**
- Use Exa web search to query top posts from: r/artificial, r/LocalLLaMA, 
  r/MachineLearning, r/ChatGPT, r/ClaudeAI, r/singularity
- Filter: posts from last 7 days with >100 upvotes
- Extract: title, upvotes, top 3 comments, post URL, theme tags
- Return structured JSON

**2. TWITTER MONITOR AGENT**  
- Use Exa tweet category search for queries:
  - "AI agents breakthrough" 
  - "LLM new capability announcement"
  - "Claude GPT Gemini hot take"
  - "AI tools for developers viral"
- Filter: last 7 days, high engagement signals
- Extract: tweet text, author handle, engagement estimate, URL
- Return structured JSON

**3. YOUTUBE SIGNAL AGENT**
- Use Exa web search targeting youtube.com for AI agent videos
- Queries: "AI agents tutorial 2025", "AI automation breakthrough", "Claude Code demo"
- Filter: uploaded in last 14 days, high view signals
- Extract: video title, channel, hook (first sentence of description), URL
- Return structured JSON

**4. TREND SYNTHESIZER AGENT**
- Takes output from agents 1-3
- Identifies top 5 cross-platform themes
- For each theme: name, evidence (source URLs), momentum score (1-10), content angle
- Output: ranked theme list with analysis

**5. CONTENT IDEATION AGENT**
System prompt:
"You are a viral content strategist for a technical founder building in public 
in the AI space. You specialize in Twitter/X content that earns followers. 
You know that scroll-stopping content has: a hook that creates curiosity or 
controversy in the first 5 words, a clear value promise, and a unique angle 
the audience hasn't seen. Avoid generic AI hype. Lean into: builder perspective, 
contrarian takes, specific technical insights, behind-the-scenes of building."

For each top theme, generate:
- 3 content ideas (different formats: hot take, thread, breakdown)
- For each idea: hook line, content outline, why it will perform, virality score

**6. VIRALITY ANALYZER**
For each generated content piece, score:
- Hook strength (1-10): Does the first line stop scrolling?
- Curiosity gap (1-10): Does it make people NEED to read more?
- Novelty (1-10): Is this a fresh angle or generic?
- Relatability (1-10): Will target audience (technical founders) feel this?
- Overall virality potential: Low / Medium / High / Viral

### Output
Generate a Content Brief as a beautiful React dashboard showing:
1. Top trending themes (with platform breakdown)
2. Ranked content ideas (sorted by virality score)
3. Ready-to-post drafts with hooks highlighted
4. "Why this works" analysis for each piece
5. Weekly content calendar suggestion

### Technical Stack
- Agent framework: Claude API with tool use
- Search: Exa API (web search + tweet category)
- Storage: JSON files per run (timestamped)
- UI: React dashboard with Tailwind
- Runner: Node.js CLI with --run flag to execute full pipeline

### Files to Create
- /agents/reddit-agent.js
- /agents/twitter-agent.js  
- /agents/youtube-agent.js
- /agents/trend-synthesizer.js
- /agents/content-generator.js
- /agents/virality-scorer.js
- /orchestrator.js (runs full pipeline)
- /ui/dashboard.jsx (React review UI)
- /config.js (API keys, subreddit list, search queries)
- README.md (setup + usage instructions)

### Key Constraints
- Each agent runs independently and can be tested in isolation
- All agents output structured JSON that the next agent consumes
- The orchestrator saves a full run report to /outputs/YYYY-MM-DD-report.json
- The dashboard loads from the latest report file
- Designed for daily runs (cron-friendly)
- All prompts are in /prompts/ folder so they're easy to edit without touching code
```

---

## Build Phases

### Phase 1 — Core Pipeline (Build First)
- Reddit agent + Twitter agent working
- Basic trend synthesizer
- Content ideas output to terminal

### Phase 2 — Intelligence Layer
- YouTube agent
- Virality scorer
- Refined content generation with your voice/tone

### Phase 3 — Review UI
- React dashboard
- Content calendar
- One-click copy to clipboard

---

## What Makes This Agent Unique

Unlike generic content tools, this agent:
1. **Cross-platform signal synthesis** — finds what's viral everywhere, not just one place
2. **Scroll-stop analysis** — doesn't just find trends, scores WHY content performs
3. **Your voice** — generates in the voice of a technical builder, not generic AI content
4. **Repurposing engine** — turns Reddit threads into Twitter threads automatically
5. **Daily runs** — fresh intel every day, 10 minutes of your time to review + post