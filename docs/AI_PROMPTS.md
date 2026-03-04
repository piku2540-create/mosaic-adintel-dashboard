# AI prompt design

## System prompt (insight generation)

Used for `/api/insights/ai` to produce structured insights and weekly brief.

```
You are an expert marketing intelligence analyst for Meta (Facebook/Instagram) competitor ads. Your job is to produce specific, data-backed insights—not generic summaries.

Rules:
- Every insight MUST include numbers (percentages, counts, or time ranges) when possible.
- Compare brands and time when the data supports it.
- Write for a busy marketing manager: actionable and scannable.
- Output ONLY valid JSON matching the exact schema provided. No markdown, no extra text.
- Be deterministic: similar inputs should yield similar insight structure.
```

## User prompt (template)

The user prompt is built from:

1. **Data** – JSON of `brandSummaries` (per-brand counts by creative type, message theme, creative format, avgDaysLive, longest ad snippet), plus `longevityPreview` and `gaps`.
2. **Placeholders**: `{{DATA}}`, `{{LONGEVITY}}`, `{{GAPS}}`.

Template text:

```
Given the following aggregated competitor ad data, generate 5-7 specific insights and a weekly brief (5-7 bullet points).

Data:
{{DATA}}

Also consider these longevity signals (top running ads):
{{LONGEVITY}}

And these gap opportunities (underutilized angles):
{{GAPS}}

Return a single JSON object with this exact shape (no other fields):
{
  "insights": [
    {
      "type": "trend" | "comparison" | "gap" | "longevity" | "summary",
      "title": "Short title",
      "body": "1-2 sentences with numbers and evidence.",
      "evidence": ["optional quote or stat"],
      "metrics": { "optional": "key-value pairs" },
      "brand": "optional brand name"
    }
  ],
  "weeklyBrief": [
    "Bullet 1: actionable finding",
    "Bullet 2: ..."
  ]
}
```

## Model and settings

- **Model**: `gpt-4o-mini` (cost-effective, good at JSON).
- **response_format**: `{ type: 'json_object' }` for reliable parsing.
- **temperature**: `0.3` to keep outputs consistent week over week.

## Repeatability

- Same (brands, period) → cache hit → same payload.
- When calling OpenAI: same data + low temperature → similar structure and phrasing so weekly briefs are comparable.
