# Architecture Overview

## High-level stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Frontend    | React 18, TypeScript, Vite           |
| UI          | Tailwind CSS, Radix UI primitives, Framer Motion, Recharts |
| Backend     | Node.js, Express                     |
| AI          | OpenAI API (gpt-4o-mini) with JSON mode |
| Storage     | In-memory (replaceable with DB + Redis) |

## Frontend architecture

```
frontend/
├── src/
│   ├── components/       # Reusable UI
│   │   ├── ui/           # Button, Card, Dialog (shadcn-style)
│   │   ├── UploadModal.tsx
│   │   ├── BrandSelector.tsx
│   │   ├── FiltersBar.tsx
│   │   └── Dashboard/   # Section components
│   │       ├── OverviewKPIs.tsx
│   │       ├── AdFormatDistribution.tsx
│   │       ├── MessageThemeTrends.tsx
│   │       ├── LongestRunningAds.tsx
│   │       ├── GapOpportunities.tsx
│   │       └── AIWeeklyBrief.tsx
│   ├── lib/
│   │   ├── api.ts        # All API calls
│   │   └── utils.ts      # cn(), etc.
│   ├── types/            # Shared TS types (mirror backend)
│   ├── App.tsx           # Layout, state, data loading
│   └── main.tsx
├── index.html
├── tailwind.config.js    # Theme, dark mode ready
└── vite.config.ts        # Proxy /api -> backend
```

- **State**: React useState in `App`; filters and selected brands drive all API calls.
- **Data flow**: Upload → brands list; filters (brand, type, theme, date) → `/api/ads`, `/api/insights/*`.
- **Sticky filters**: Filters bar is sticky; brand multi-select supports up to 10 competitors.

## Backend architecture

```
backend/
├── src/
│   ├── index.ts          # Express app, CORS, routes
│   ├── store.ts          # In-memory ads + insight cache
│   ├── types/            # ParsedAd, BrandSummary, AI payloads
│   ├── utils/
│   │   ├── csvParser.ts  # Defensive CSV → ParsedAd[]
│   │   └── categorization.ts  # Message theme + creative format
│   ├── services/
│   │   └── insightService.ts   # Summaries, longevity, gaps, AI
│   └── routes/
│       ├── upload.ts     # POST /api/upload (multer)
│       ├── ads.ts        # GET /api/ads, /api/ads/brands
│       └── insights.ts   # /summaries, /longevity, /gaps, /ai
├── package.json
└── tsconfig.json
```

- **API-first**: All data via REST; no server-rendered HTML.
- **CSV**: Column aliases (e.g. `brand_name`, `Brand Name`) map to a single schema; unknown columns ignored.
- **Categorization**: Rule-based keyword scoring for theme + format; deterministic.
- **Insight cache**: By (brands + period); cache size capped (e.g. 10) to avoid unbounded growth.

## Scalability notes

- **Storage**: Replace in-memory store with Postgres (ads, snapshots) and Redis (insight cache).
- **Weekly snapshots**: Persist `getAds()` + `getSummaries()` by week; compare in AI prompt for “vs last week” insights.
- **Auth**: Add JWT or session middleware when needed; keep upload and read routes behind auth.
- **Rate limiting**: Add rate limits on `/api/insights/ai` to control OpenAI cost.
