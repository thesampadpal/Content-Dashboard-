# 🚀 Viral Content Intelligence Agent

A multi-source AI content repurposing agent that monitors Reddit, Twitter/X for viral AI content, identifies cross-platform trends, and generates scroll-stopping content ideas.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                          │
│        (coordinates all agents, saves reports)           │
└──────┬──────────┬──────────┬──────────┬─────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  REDDIT       TWITTER     TREND      CONTENT
  AGENT        AGENT       SYNTH      GENERATOR
  (Exa+Gemini) (Exa+Gemini) (Gemini)  (Gemini)
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add your API keys

Copy `.env.example` to `.env` and add your keys:

```bash
cp .env.example .env
```

```env
EXA_API_KEY=your_exa_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

- **Exa API Key**: Get from [dashboard.exa.ai](https://dashboard.exa.ai)
- **Gemini API Key** (free!): Get from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 3. Run the pipeline

```bash
npm start
```

Or run directly:

```bash
node orchestrator.js --run
```

## Individual Agents

Each agent can be tested independently:

```bash
npm run reddit     # Reddit agent only
npm run twitter    # Twitter agent only
npm run trends     # Trend synthesizer (sample data)
npm run content    # Content generator (sample data)
```

## Output

Each run saves a report to `/outputs/YYYY-MM-DD-report.json` containing:

- **reddit_data**: Structured posts from viral Reddit discussions
- **twitter_data**: Structured tweets from viral Twitter/X content
- **trends**: Top 5 cross-platform themes with momentum scores
- **content_ideas**: Ranked content ideas (hot takes, threads, breakdowns)
- **timings**: How long each agent took

## Configuration

Edit `config.js` to customize:

- **Subreddits** to monitor
- **Search queries** for Reddit and Twitter
- **Time windows** (days to look back)
- **Number of results** per query
- **AI models** used for each step
- **Number of trends** and **ideas per trend**

## Project Structure

```
├── agents/
│   ├── reddit-agent.js       # Searches Reddit via Exa
│   ├── twitter-agent.js      # Searches Twitter via Exa
│   ├── trend-synthesizer.js  # Cross-platform trend analysis
│   └── content-generator.js  # Viral content ideation
├── prompts/
│   ├── reddit-agent.md       # Reddit extraction prompt
│   ├── twitter-agent.md      # Twitter extraction prompt
│   ├── trend-synthesizer.md  # Trend synthesis prompt
│   └── content-generator.md  # Content strategy prompt
├── outputs/                  # Saved reports (auto-created)
├── config.js                 # All configuration
├── orchestrator.js           # Pipeline runner
└── .env                      # API keys (not committed)
```

## Build Phases

- [x] **Phase 1** — Core Pipeline (Reddit + Twitter + Trends + Content Ideas)
- [ ] **Phase 2** — Intelligence Layer (YouTube agent, virality scorer, refined voice)
- [ ] **Phase 3** — Review UI (React dashboard, content calendar, one-click copy)
