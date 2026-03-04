/**
 * AI Insights service: builds context from aggregated data and calls OpenAI.
 * Returns structured JSON (AIInsightsPayload) for repeatable weekly briefs.
 */
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
function computeDaysLive(ad, todayIso = new Date().toISOString().slice(0, 10)) {
    const first = ad.adFirstSeenDate || ad.startDate;
    if (!first)
        return 0;
    const end = ad.isCurrentlyActive ? todayIso : ad.adLastSeenDate || ad.endDate || todayIso;
    const a = new Date(first);
    const b = new Date(end);
    if (isNaN(a.getTime()) || isNaN(b.getTime()))
        return 0;
    const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}
export function computeBrandSummaries(ads, brandFilter) {
    const byBrand = new Map();
    for (const ad of ads) {
        if (brandFilter.length && !brandFilter.includes(ad.brandName))
            continue;
        const list = byBrand.get(ad.brandName) || [];
        list.push(ad);
        byBrand.set(ad.brandName, list);
    }
    const summaries = [];
    for (const [brandName, list] of byBrand) {
        const byType = {};
        const byTheme = {};
        const byFormat = {};
        const byAdType = {};
        const byHookType = {};
        let totalDays = 0;
        let longest = null;
        let maxDays = 0;
        for (const ad of list) {
            const daysLive = computeDaysLive(ad);
            byType[ad.adCreativeType] = (byType[ad.adCreativeType] || 0) + 1;
            byTheme[ad.messageTheme] = (byTheme[ad.messageTheme] || 0) + 1;
            byFormat[ad.creativeFormat] = (byFormat[ad.creativeFormat] || 0) + 1;
            if (ad.adType)
                byAdType[ad.adType] = (byAdType[ad.adType] || 0) + 1;
            if (ad.hookType)
                byHookType[ad.hookType] = (byHookType[ad.hookType] || 0) + 1;
            totalDays += daysLive;
            if (daysLive > maxDays) {
                maxDays = daysLive;
                longest = ad;
            }
        }
        summaries.push({
            brandName,
            totalAds: list.length,
            byCreativeType: byType,
            byMessageTheme: byTheme,
            byCreativeFormat: byFormat,
            byAdType,
            byHookType,
            avgDaysLive: list.length ? Math.round(totalDays / list.length) : 0,
            longestRunningAd: longest,
        });
    }
    return summaries;
}
export function getLongevityAds(ads, topN, brandFilter) {
    const filtered = brandFilter.length ? ads.filter((a) => brandFilter.includes(a.brandName)) : ads;
    const sorted = [...filtered].sort((a, b) => computeDaysLive(b) - computeDaysLive(a));
    return sorted.slice(0, topN).map((ad, i) => ({
        ad,
        daysLive: computeDaysLive(ad),
        rank: i + 1,
    }));
}
export function detectGaps(ads) {
    const gaps = [];
    if (!ads.length)
        return gaps;
    const total = ads.length;
    const countBy = (key) => {
        const map = new Map();
        for (const ad of ads) {
            const raw = ad[key]?.trim();
            if (!raw)
                continue;
            const v = raw.toLowerCase();
            map.set(v, (map.get(v) || 0) + 1);
        }
        return map;
    };
    const brandsFor = (key, value) => {
        const lower = value.toLowerCase();
        const set = new Set();
        for (const ad of ads) {
            const raw = ad[key]?.trim().toLowerCase();
            if (raw === lower) {
                set.add(ad.brandName);
            }
        }
        return Array.from(set);
    };
    const emotionalMap = countBy('emotionalTrigger');
    const funnelMap = countBy('funnelStage');
    const scrollMap = countBy('scrollStopperType');
    const offerMap = countBy('offerType');
    const toneMap = countBy('tone');
    const painMap = countBy('primaryPainPoint');
    const ctaMap = countBy('cta');
    const canonicalEmotions = ['fear', 'hope', 'urgency', 'aspiration', 'authority'];
    // Underutilized emotional triggers (present but <10% share)
    for (const emo of canonicalEmotions) {
        const count = emotionalMap.get(emo) || 0;
        if (!count)
            continue;
        const share = count / total;
        if (share < 0.1) {
            gaps.push({
                category: 'emotional_trigger',
                description: `Emotional trigger "${emo}" is underutilized`,
                competitorsUsing: brandsFor('emotionalTrigger', emo),
                opportunity: `Only ${(share * 100).toFixed(1)}% of ads use "${emo}" as the primary emotional trigger. Test more creatives that lean into this emotion.`,
                confidence: 'medium',
            });
        }
    }
    // Unused funnel stages (latest taxonomy)
    const canonicalStages = ['awareness', 'interest', 'consideration', 'intent', 'evaluation', 'purchase'];
    for (const stage of canonicalStages) {
        if (!funnelMap.get(stage)) {
            gaps.push({
                category: 'funnel_stage',
                description: `Funnel stage "${stage}" not used`,
                competitorsUsing: [],
                opportunity: `No ads are tagged as "${stage}". Consider building creatives for this stage to close journey gaps.`,
                confidence: 'high',
            });
        }
    }
    // Missing scroll stopper types
    if (scrollMap.size) {
        const uniqueScrolls = Array.from(scrollMap.keys());
        if (uniqueScrolls.length === 1) {
            const onlyType = uniqueScrolls[0];
            gaps.push({
                category: 'scroll_stopper',
                description: `Single scroll-stopper type "${onlyType}" dominates`,
                competitorsUsing: brandsFor('scrollStopperType', onlyType),
                opportunity: 'All ads rely on one scroll-stopper type. Introduce variation (e.g. pattern-interrupt visuals, bold text frames, creator-led hooks).',
                confidence: 'medium',
            });
        }
    }
    // Overused offer types
    if (offerMap.size) {
        const sortedOffers = Array.from(offerMap.entries()).sort((a, b) => b[1] - a[1]);
        const [topOffer, topCount] = sortedOffers[0];
        const share = topCount / total;
        if (share > 0.4) {
            gaps.push({
                category: 'offer_type',
                description: `Offer type "${topOffer}" is saturated`,
                competitorsUsing: brandsFor('offerType', topOffer),
                opportunity: `"${topOffer}" appears in ${(share * 100).toFixed(1)}% of ads. Test non-discount or value-led offers to cut through.`,
                confidence: 'medium',
            });
        }
    }
    // Dominant tone
    if (toneMap.size) {
        const sortedTone = Array.from(toneMap.entries()).sort((a, b) => b[1] - a[1]);
        const [topTone, topCount] = sortedTone[0];
        const share = topCount / total;
        if (share > 0.5) {
            gaps.push({
                category: 'tone',
                description: `Tone "${topTone}" dominates`,
                competitorsUsing: brandsFor('tone', topTone),
                opportunity: `"${topTone}" tone is used in ${(share * 100).toFixed(1)}% of ads. Introduce contrasting tones (e.g. authority, humor, or empathy) for variety.`,
                confidence: 'medium',
            });
        }
    }
    // Pain-point whitespace (top pain point overshadowing others)
    if (painMap.size >= 2) {
        const sortedPain = Array.from(painMap.entries()).sort((a, b) => b[1] - a[1]);
        const [topPain, topCount] = sortedPain[0];
        const share = topCount / total;
        if (share > 0.6) {
            gaps.push({
                category: 'pain_point',
                description: `Pain point "${topPain}" dominates messaging`,
                competitorsUsing: brandsFor('primaryPainPoint', topPain),
                opportunity: `"${topPain}" appears in ${(share * 100).toFixed(1)}% of ads. Explore secondary pain points from research (e.g. stress, self-confidence, convenience) to open new angles.`,
                confidence: 'medium',
            });
        }
    }
    // Unused CTA types
    const canonicalCtas = ['shop now', 'learn more', 'buy now', 'sign up'];
    for (const cta of canonicalCtas) {
        if (!ctaMap.get(cta)) {
            gaps.push({
                category: 'cta',
                description: `CTA "${cta}" not used`,
                competitorsUsing: [],
                opportunity: `No creatives use "${cta}" as a call-to-action. Test whether this CTA improves downstream conversion for key funnels.`,
                confidence: 'low',
            });
        }
    }
    return gaps;
}
// —— Helpers for intelligence modules ——
function percentileRank(sortedValues, value) {
    if (sortedValues.length === 0)
        return 0;
    const countBelowOrEqual = sortedValues.filter((v) => v <= value).length;
    return countBelowOrEqual / sortedValues.length;
}
function normalize01(value, min, max) {
    if (max <= min)
        return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
// —— 1) Creative Strength Index ——
export function computeCreativeStrength(filteredData) {
    const items = [];
    const insights = [];
    if (filteredData.length === 0) {
        return { items: [], avgByBrand: [], avgByFormat: [], insights: [] };
    }
    const daysLiveValues = filteredData.map((a) => computeDaysLive(a)).sort((a, b) => a - b);
    const minDays = daysLiveValues[0] ?? 0;
    const maxDays = daysLiveValues[daysLiveValues.length - 1] ?? 0;
    const byFormatSum = {};
    const byFunnelSum = {};
    for (const ad of filteredData) {
        const days = computeDaysLive(ad);
        const fmt = ad.adCreativeType || 'Unknown';
        byFormatSum[fmt] = byFormatSum[fmt] || { total: 0, count: 0 };
        byFormatSum[fmt].total += days;
        byFormatSum[fmt].count += 1;
        const stage = (ad.funnelStage || '').trim() || 'Unknown';
        byFunnelSum[stage] = byFunnelSum[stage] || { total: 0, count: 0 };
        byFunnelSum[stage].total += days;
        byFunnelSum[stage].count += 1;
    }
    const avgByFormat = {};
    for (const [fmt, o] of Object.entries(byFormatSum)) {
        avgByFormat[fmt] = o.count ? o.total / o.count : 0;
    }
    const formatAvgs = Object.values(avgByFormat);
    const formatMin = formatAvgs.length ? Math.min(...formatAvgs) : 0;
    const formatMax = formatAvgs.length ? Math.max(...formatAvgs) : 0;
    const avgByFunnel = {};
    for (const [stage, o] of Object.entries(byFunnelSum)) {
        avgByFunnel[stage] = o.count ? o.total / o.count : 0;
    }
    const funnelAvgs = Object.values(avgByFunnel);
    const funnelMin = funnelAvgs.length ? Math.min(...funnelAvgs) : 0;
    const funnelMax = funnelAvgs.length ? Math.max(...funnelAvgs) : 0;
    for (const ad of filteredData) {
        const days = computeDaysLive(ad);
        const daysPercentile = percentileRank(daysLiveValues, days);
        const activeScore = ad.isCurrentlyActive ? 1 : 0;
        const fmt = ad.adCreativeType || 'Unknown';
        const stage = (ad.funnelStage || '').trim() || 'Unknown';
        const formatNorm = normalize01(avgByFormat[fmt] ?? 0, formatMin, formatMax);
        const funnelNorm = normalize01(avgByFunnel[stage] ?? 0, funnelMin, funnelMax);
        const raw = daysPercentile * 0.5 + activeScore * 0.2 + formatNorm * 0.15 + funnelNorm * 0.15;
        const creativeStrengthScore = Math.round(Math.max(0, Math.min(100, raw * 100)));
        items.push({ ad, creativeStrengthScore, creativeStrengthPercentile: 0 });
    }
    const scoreValues = items.map((i) => i.creativeStrengthScore).sort((a, b) => a - b);
    for (const item of items) {
        item.creativeStrengthPercentile = Math.round(percentileRank(scoreValues, item.creativeStrengthScore) * 100);
    }
    const byBrandSum = {};
    for (const { ad, creativeStrengthScore } of items) {
        const b = ad.brandName || 'Unknown';
        byBrandSum[b] = byBrandSum[b] || { sum: 0, count: 0 };
        byBrandSum[b].sum += creativeStrengthScore;
        byBrandSum[b].count += 1;
    }
    const avgByBrandList = Object.entries(byBrandSum).map(([brandName, o]) => ({
        brandName,
        avgScore: o.count ? Math.round((o.sum / o.count) * 10) / 10 : 0,
    }));
    const byFormatScore = {};
    for (const { ad, creativeStrengthScore } of items) {
        const f = ad.adCreativeType || 'Unknown';
        byFormatScore[f] = byFormatScore[f] || { sum: 0, count: 0 };
        byFormatScore[f].sum += creativeStrengthScore;
        byFormatScore[f].count += 1;
    }
    const avgByFormatList = Object.entries(byFormatScore).map(([format, o]) => ({
        format,
        avgScore: o.count ? Math.round((o.sum / o.count) * 10) / 10 : 0,
    }));
    const sorted = [...items].sort((a, b) => b.creativeStrengthScore - a.creativeStrengthScore);
    if (sorted.length >= 1) {
        insights.push(`Strongest creative: ${sorted[0].ad.brandName} (score ${sorted[0].creativeStrengthScore}) — ${sorted[0].ad.adCreativeType}, ${sorted[0].ad.messageTheme || 'N/A'}.`);
    }
    if (avgByFormatList.length > 0) {
        const best = avgByFormatList.sort((a, b) => b.avgScore - a.avgScore)[0];
        insights.push(`Format "${best.format}" has the highest average creative strength (${best.avgScore}).`);
    }
    return {
        items,
        avgByBrand: avgByBrandList,
        avgByFormat: avgByFormatList,
        insights,
    };
}
// —— 2) Competitor Aggression Score ——
export function computeAggressionScore(filteredData) {
    const insights = [];
    if (filteredData.length === 0) {
        return { brands: [], insights: [] };
    }
    const byBrand = new Map();
    for (const ad of filteredData) {
        const b = ad.brandName || 'Unknown';
        if (!byBrand.has(b))
            byBrand.set(b, { ads: [], months: new Set() });
        const rec = byBrand.get(b);
        rec.ads.push(ad);
        const dateStr = ad.adFirstSeenDate || ad.startDate || '';
        if (dateStr.length >= 7)
            rec.months.add(dateStr.slice(0, 7));
    }
    const rows = [];
    for (const [brandName, { ads, months }] of byBrand) {
        const totalAds = ads.length;
        const totalDays = ads.reduce((acc, a) => acc + computeDaysLive(a), 0);
        const avgDaysLive = totalAds ? totalDays / totalAds : 0;
        const videoCount = ads.filter((a) => a.adCreativeType === 'Video').length;
        const pctVideo = totalAds ? (videoCount / totalAds) * 100 : 0;
        const numMonths = Math.max(1, months.size);
        const adsPerMonth = totalAds / numMonths;
        rows.push({
            brandName,
            totalAds,
            avgDaysLive: Math.round(avgDaysLive * 10) / 10,
            pctVideo: Math.round(pctVideo * 10) / 10,
            adsPerMonth: Math.round(adsPerMonth * 10) / 10,
            aggressionScore: 0,
            tier: 'Medium',
        });
    }
    const totalAdsArr = rows.map((r) => r.totalAds);
    const avgDaysArr = rows.map((r) => r.avgDaysLive).filter((d) => d > 0);
    const velocityArr = rows.map((r) => r.adsPerMonth);
    const videoArr = rows.map((r) => r.pctVideo);
    const totalMin = Math.min(...totalAdsArr);
    const totalMax = Math.max(...totalAdsArr);
    const churnMin = avgDaysArr.length ? Math.min(...avgDaysArr) : 0;
    const churnMax = avgDaysArr.length ? Math.max(...avgDaysArr) : 0;
    const velMin = Math.min(...velocityArr);
    const velMax = Math.max(...velocityArr);
    const vidMin = Math.min(...videoArr);
    const vidMax = Math.max(...videoArr);
    for (const row of rows) {
        const volumeScore = normalize01(row.totalAds, totalMin, totalMax);
        const churnScore = churnMax > churnMin
            ? 1 - normalize01(row.avgDaysLive, churnMin, churnMax)
            : 0;
        const velocityScore = velMax > velMin ? normalize01(row.adsPerMonth, velMin, velMax) : 0;
        const videoScore = vidMax > vidMin ? normalize01(row.pctVideo, vidMin, vidMax) : 0;
        const raw = volumeScore * 0.35 + churnScore * 0.25 + velocityScore * 0.25 + videoScore * 0.15;
        row.aggressionScore = Math.round(Math.max(0, Math.min(100, raw * 100)));
    }
    rows.sort((a, b) => b.aggressionScore - a.aggressionScore);
    const n = rows.length;
    for (let i = 0; i < rows.length; i++) {
        const pct = (i + 1) / n;
        if (pct <= 0.25)
            rows[i].tier = 'Top 25%';
        else if (pct <= 0.5)
            rows[i].tier = 'High';
        else if (pct <= 0.75)
            rows[i].tier = 'Medium';
        else if (pct < 1)
            rows[i].tier = 'Low';
        else
            rows[i].tier = 'Bottom 25%';
    }
    if (rows.length > 0) {
        insights.push(`Most aggressive brand in this set: ${rows[0].brandName} (score ${rows[0].aggressionScore}) — ${rows[0].totalAds} ads, ${rows[0].avgDaysLive} avg days live.`);
        const lowChurn = rows.filter((r) => r.avgDaysLive < (churnMin + churnMax) / 2).length;
        insights.push(`${lowChurn} brand(s) show high churn (below median avg days live).`);
    }
    return { brands: rows, insights };
}
// —— 3) Emotion × Format Longevity Matrix ——
export function computeEmotionFormatMatrix(filteredData) {
    const insights = [];
    const key = (emo, fmt) => `${emo}|||${fmt}`;
    const cellsMap = new Map();
    for (const ad of filteredData) {
        const emo = (ad.emotionalTrigger || '').trim() || 'Unknown';
        const fmt = ad.adCreativeType || 'Unknown';
        const k = key(emo, fmt);
        if (!cellsMap.has(k)) {
            cellsMap.set(k, { emotionalTrigger: emo, adFormat: fmt, daysSum: 0, count: 0, activeCount: 0 });
        }
        const c = cellsMap.get(k);
        c.daysSum += computeDaysLive(ad);
        c.count += 1;
        if (ad.isCurrentlyActive)
            c.activeCount += 1;
    }
    const cells = [];
    for (const c of cellsMap.values()) {
        if (c.count < 5)
            continue;
        const avgDaysLive = Math.round((c.daysSum / c.count) * 10) / 10;
        const pctActive = Math.round((c.activeCount / c.count) * 1000) / 10;
        cells.push({
            emotionalTrigger: c.emotionalTrigger,
            adFormat: c.adFormat,
            avgDaysLive,
            count: c.count,
            pctActive,
        });
    }
    if (cells.length === 0) {
        return { cells: [], insights: [] };
    }
    const avgDaysAll = cells.reduce((a, c) => a + c.avgDaysLive, 0) / cells.length;
    const countAll = cells.reduce((a, c) => a + c.count, 0);
    const avgCount = countAll / cells.length;
    const underusedThreshold = avgCount * 0.5;
    const overusedThreshold = avgCount * 1.5;
    for (const cell of cells) {
        if (cell.count <= underusedThreshold && cell.avgDaysLive >= avgDaysAll) {
            cell.flagUnderusedHighLongevity = true;
        }
        if (cell.count >= overusedThreshold && cell.avgDaysLive < avgDaysAll) {
            cell.flagOverusedLowLongevity = true;
        }
    }
    const underused = cells.filter((c) => c.flagUnderusedHighLongevity);
    const overused = cells.filter((c) => c.flagOverusedLowLongevity);
    if (underused.length > 0) {
        const u = underused[0];
        insights.push(`Underused + high longevity: "${u.emotionalTrigger}" × ${u.adFormat} (${u.count} ads, ${u.avgDaysLive} avg days live).`);
    }
    if (overused.length > 0) {
        const o = overused[0];
        insights.push(`Overused + low longevity: "${o.emotionalTrigger}" × ${o.adFormat} (${o.count} ads, ${o.avgDaysLive} avg days live).`);
    }
    return { cells: cells.sort((a, b) => b.avgDaysLive - a.avgDaysLive), insights };
}
// —— 4) Pain–Offer Alignment Score ——
export function computePainOfferAlignment(filteredData) {
    const insights = [];
    const norm = (v) => (v === null || v === undefined ? '' : String(v).trim().toLowerCase());
    const byBrand = new Map();
    const comboCount = new Map();
    for (const ad of filteredData) {
        const pain = norm(ad.primaryPainPoint);
        const offer = norm(ad.offerType);
        const hasPain = pain.length > 0;
        const hasOffer = offer.length > 0 && offer !== 'none';
        const aligned = hasPain && hasOffer;
        if (hasPain) {
            const b = ad.brandName || 'Unknown';
            if (!byBrand.has(b))
                byBrand.set(b, { aligned: 0, withPain: 0 });
            const rec = byBrand.get(b);
            rec.withPain += 1;
            if (aligned)
                rec.aligned += 1;
        }
        if (hasPain && hasOffer) {
            const key = `${pain}|||${offer}`;
            comboCount.set(key, (comboCount.get(key) || 0) + 1);
        }
    }
    const byBrandList = [];
    for (const [brandName, { aligned, withPain }] of byBrand) {
        const alignmentPct = withPain ? Math.round((aligned / withPain) * 1000) / 10 : 0;
        byBrandList.push({ brandName, alignedCount: aligned, totalWithPainPoint: withPain, alignmentPct });
    }
    const topCombos = Array.from(comboCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => {
        const [pain, offer] = key.split('|||');
        return { pain, offer, count };
    });
    const sorted = [...byBrandList].sort((a, b) => b.alignmentPct - a.alignmentPct);
    const topBrands = sorted.slice(0, 5);
    const bottomBrands = sorted.slice(-5).reverse();
    if (topBrands.length > 0) {
        insights.push(`Best pain–offer alignment: ${topBrands[0].brandName} (${topBrands[0].alignmentPct}% of ads with pain point have an offer).`);
    }
    if (topCombos.length > 0) {
        insights.push(`Top combination: "${topCombos[0].pain}" + "${topCombos[0].offer}" (${topCombos[0].count} ads).`);
    }
    return {
        byBrand: byBrandList,
        topCombos,
        topBrands,
        bottomBrands,
        insights,
    };
}
const SYSTEM_PROMPT = `You are an expert marketing intelligence analyst for Meta (Facebook/Instagram) competitor ads. Your job is to produce specific, data-backed insights—not generic summaries.

Rules:
- Every insight MUST include numbers (percentages, counts, or time ranges) when possible.
- Compare brands and time when the data supports it.
- Write for a busy marketing manager: actionable and scannable.
- Output ONLY valid JSON matching the exact schema provided. No markdown, no extra text.
- Be deterministic: similar inputs should yield similar insight structure.`;
const USER_PROMPT_TEMPLATE = `Given the following aggregated competitor ad data, generate 5-7 specific insights and a weekly brief (5-7 bullet points).

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
}`;
export async function generateAIInsights(ads, brandFilter, period) {
    const summaries = computeBrandSummaries(ads, brandFilter);
    const longevity = getLongevityAds(ads, 10, brandFilter);
    const gaps = detectGaps(ads);
    // Advanced aggregates for creative strategy analysis
    const totalAds = ads.length;
    const countBy = (key) => {
        const map = new Map();
        for (const ad of ads) {
            const raw = ad[key]?.trim();
            if (!raw)
                continue;
            const v = raw.toLowerCase();
            map.set(v, (map.get(v) || 0) + 1);
        }
        return map;
    };
    const emotionalMap = countBy('emotionalTrigger');
    const funnelMap = countBy('funnelStage');
    const painMap = countBy('primaryPainPoint');
    const offerMap = countBy('offerType');
    const ctaMap = countBy('cta');
    const toneMap = countBy('tone');
    const visualMap = countBy('visualStyle');
    const topN = (map, n) => Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([value, count]) => ({
        value,
        count,
        share: totalAds ? count / totalAds : 0,
    }));
    const dataBlob = JSON.stringify({
        brandSummaries: summaries.map((s) => ({
            brandName: s.brandName,
            totalAds: s.totalAds,
            byCreativeType: s.byCreativeType,
            byMessageTheme: s.byMessageTheme,
            byCreativeFormat: s.byCreativeFormat,
            byAdType: s.byAdType,
            byHookType: s.byHookType,
            avgDaysLive: s.avgDaysLive,
            longestRunningAd: s.longestRunningAd
                ? { adId: s.longestRunningAd.adId, daysLive: s.longestRunningAd.daysLive, type: s.longestRunningAd.adCreativeType, theme: s.longestRunningAd.messageTheme }
                : null,
        })),
        longevityPreview: longevity.map((l) => ({
            brand: l.ad.brandName,
            daysLive: l.daysLive,
            type: l.ad.adCreativeType,
            theme: l.ad.messageTheme,
        })),
        gaps: gaps,
        advanced: {
            topEmotionalTriggers: topN(emotionalMap, 3),
            topFunnelStages: topN(funnelMap, 3),
            topPainPoints: topN(painMap, 3),
            topOffers: topN(offerMap, 3),
            topCtas: topN(ctaMap, 3),
            topTones: topN(toneMap, 3),
            topVisualStyles: topN(visualMap, 3),
            totalAds,
        },
    }, null, 2);
    const userPrompt = USER_PROMPT_TEMPLATE.replace('{{DATA}}', dataBlob)
        .replace('{{LONGEVITY}}', JSON.stringify(longevity.map((l) => ({ brand: l.ad.brandName, daysLive: l.daysLive, type: l.ad.adCreativeType })), null, 2))
        .replace('{{GAPS}}', JSON.stringify(gaps, null, 2));
    if (!process.env.OPENAI_API_KEY) {
        return mockInsights(summaries, longevity, gaps, period);
    }
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });
        const content = completion.choices[0]?.message?.content;
        if (!content)
            throw new Error('Empty AI response');
        const parsed = JSON.parse(content);
        return {
            generatedAt: new Date().toISOString(),
            period,
            insights: parsed.insights || [],
            weeklyBrief: parsed.weeklyBrief || [],
        };
    }
    catch (e) {
        console.error('AI insight generation failed:', e);
        return mockInsights(summaries, longevity, gaps, period);
    }
}
function mockInsights(summaries, longevity, gaps, period) {
    const insights = [];
    const totalAds = summaries.reduce((a, s) => a + s.totalAds, 0);
    for (const s of summaries) {
        const total = s.totalAds;
        const videoPct = total ? Math.round(((s.byCreativeType?.Video ?? 0) / total) * 100) : 0;
        insights.push({
            type: 'trend',
            title: `${s.brandName} creative mix`,
            body: `${videoPct}% of ${s.brandName} ads are Video; ${s.totalAds} total ads in period. Avg ad longevity: ${s.avgDaysLive} days.`,
            brand: s.brandName,
            metrics: { totalAds: s.totalAds, videoPct, avgDaysLive: s.avgDaysLive },
        });
    }
    if (longevity.length > 0) {
        const top = longevity[0];
        insights.push({
            type: 'longevity',
            title: 'Longest-running ad',
            body: `${top.ad.brandName} has an ad live for ${top.daysLive} days (${top.ad.adCreativeType}, ${top.ad.messageTheme}). Likely top performer.`,
            brand: top.ad.brandName,
            evidence: [`Ad ID: ${top.ad.adId}`, `${top.daysLive} days live`],
        });
    }
    for (const g of gaps.slice(0, 2)) {
        insights.push({
            type: 'gap',
            title: g.description,
            body: g.opportunity,
            evidence: g.competitorsUsing.length ? [`Used by: ${g.competitorsUsing.join(', ')}`] : ['No competitor using this angle'],
        });
    }
    const weeklyBrief = totalAds === 0
        ? [
            'No ads available for the current filters. Broaden the date range or brand selection to generate insights.',
        ]
        : [
            `Total ads analyzed: ${totalAds} across ${summaries.length} brands.`,
            ...insights.slice(0, 5).map((i) => i.body),
        ];
    return {
        generatedAt: new Date().toISOString(),
        period,
        insights,
        weeklyBrief,
    };
}
