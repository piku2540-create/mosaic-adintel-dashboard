# Data flow

## End-to-end

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER                                            │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ 1. Upload CSV
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Frontend: UploadModal → POST /api/upload (multipart/form-data)              │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ 2. Backend: multer → csvParser.parseCSVBuffer()
    │    - Normalize column names (aliases)
    │    - Parse dates, ad type
    │    - categorization.categorizeAd() per row → messageTheme, creativeFormat
    │    - Compute daysLive
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  store.setAds(parsedAds)                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ 3. Frontend: onSuccess(brands) → setBrands, setFilters.brands
    │    → loadDashboard() + loadAI()
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Parallel: GET /api/insights/summaries?brands=...                            │
│             GET /api/insights/longevity?brands=...&top=20                     │
│             GET /api/insights/gaps?brands=...                                │
│             GET /api/insights/ai?brands=...&dateFrom=...&dateTo=...           │
└─────────────────────────────────────────────────────────────────────────────┘
    │
    │ 4. insights/summaries, longevity, gaps: sync from store
    │    insights/ai: getCachedInsights() or generateAIInsights() → OpenAI
    │                 → setCachedInsights()
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Frontend: setSummaries, setLongevity, setGaps, setAiPayload                 │
│  → Overview KPIs, Ad Format chart, Message Theme chart, Longevity list,     │
│    Gap opportunities, AI Weekly Brief                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Filter flow

- **FiltersBar** holds: brands (multi), ad type, message theme, date from/to.
- Changing filters → `onFiltersChange` → `loadDashboard()` re-runs with new `filters.brands` (and optional date for AI).
- **Ads list** (if we add a table view) would call `GET /api/ads?brands=...&adTypes=...&messageThemes=...&dateFrom=...&dateTo=...` with the same filter state.

## AI insight flow

1. **Input to AI**: Aggregated stats (summaries), longevity preview, gap list, period.
2. **Prompt**: System (analyst persona, JSON-only) + user (data blob + longevity + gaps).
3. **Output**: Single JSON with `insights[]` and `weeklyBrief[]`.
4. **Cache key**: `brands.sort().join(',') + '|' + period.from + '|' + period.to`. Same key → return cache; skip OpenAI.
