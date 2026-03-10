# Content Intelligence Agent

Monitors Reddit and YouTube for viral AI content, synthesizes trends, and generates ready-to-post content ideas with virality scores.

## Setup

```bash
npm install
cp .env.example .env   # add your API keys
```

Required keys in `.env`:
```
EXA_API_KEY=...
GROQ_API_KEY=...
```

## Usage

```bash
npm start          # run the pipeline
npm run dashboard  # open the content studio at localhost:3000
```

Everything else can be done from the browser dashboard — run the pipeline, browse ideas, write and copy content.
