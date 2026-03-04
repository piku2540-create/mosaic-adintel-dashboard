# Ad Intel — Competitor Ad Intelligence

A production-grade web app that analyzes competitor Meta ads from CSV data and delivers **actionable AI insights** for marketing teams (SimilarWeb / Sensor Tower style).

## Features

- **CSV upload** – Defensive parser with column aliases (e.g. `brand_name`, `Brand Name`)
- **Competitor tracking** – Up to 10 brands (e.g. Bebodywise, Man Matters, Little Joys)
- **Categorization** – Ad type (Static/Video/Carousel), message theme, creative format
- **Dashboard** – Overview KPIs, format distribution, message theme mix, longest-running ads, gap opportunities
- **AI insights** – OpenAI-powered insights + weekly brief (percentages, trends, gaps)
- **Dark/light ready** – Tailwind with CSS variables

## Quick start

### Prerequisites

- Node.js 18+
- (Optional) OpenAI API key for live AI insights

### Install and run

```bash
cd competitor-ad-intel
npm run install:all
```

**Terminal 1 – backend**

```bash
npm run dev:backend
```

**Terminal 2 – frontend**

```bash
npm run dev:frontend
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3001](http://localhost:3001)

### AI insights

Set `OPENAI_API_KEY` in the environment (e.g. `.env` in `backend/` or export in shell). Without it, the app returns **mock** insights so the UI still works.

### Sample data

Use `sample-data/sample_ads.csv` to test upload and dashboards.

## Project structure

```
competitor-ad-intel/
├── frontend/          # React + Vite + Tailwind + Recharts
├── backend/           # Express + CSV parsing + categorization + AI
├── docs/              # Architecture, data flow, AI prompts, schema
│   ├── ARCHITECTURE.md
│   ├── DATA_FLOW.md
│   ├── AI_PROMPTS.md
│   └── AI_INSIGHT_SCHEMA.json
├── sample-data/       # sample_ads.csv
└── README.md
```

## API (backend)

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/upload` | Upload CSV (field: `file`) |
| GET    | `/api/ads/brands` | List unique brands |
| GET    | `/api/ads` | List ads (query: brands, adTypes, messageThemes, dateFrom, dateTo) |
| GET    | `/api/insights/summaries` | Brand summaries (query: brands) |
| GET    | `/api/insights/longevity` | Longest-running ads (query: brands, top) |
| GET    | `/api/insights/gaps` | Gap opportunities (query: brands) |
| GET    | `/api/insights/ai` | AI insights + weekly brief (query: brands, dateFrom, dateTo) |

## CSV schema (expected columns)

Column names are normalized; aliases are supported. Your CSV should include:

**Brand Information:** Brand, Competitor Brand, Brand Type (D2C / FMCG / Global Brand / Marketplace / Health Tech), Type of Competitor (Direct / Indirect), Target Audience (Men / Women / Kids)

**Platform & Ad Details:** Platform (Instagram / Facebook), Ad Format (Video / Image / Carousel), Duration (if Video), Ad Type (UGC / Founder / Testimonial / Explainer / Scientific), Date

**Messaging & Creative:** Message Theme, Hook Type (Problem / Bold Claim / Question / Testimonial / Discount), Hook Text, Primary Pain Point, Emotional Trigger, Tone

**Conversion:** CTA (Shop Now / Learn More / Buy Now), Landing Page Type (Product Page / Quiz Funnel / Offer Page)  

## Quality bar

- **YC-style MVP** – Clear value for growth/marketing leads  
- **Insight-first** – AI brief and insights are the hero; charts support them  
- **Repeatable** – Cached AI output, deterministic categorization, consistent weekly brief format  

## Non-goals (current)

- No scraping  
- No login/auth  
- No payments  

---

Built with React, TypeScript, Tailwind, Express, and OpenAI.
