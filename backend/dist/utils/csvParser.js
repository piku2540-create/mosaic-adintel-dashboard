/**
 * CSV parser aligned with the latest CSV structure.
 * Parsing is case-insensitive and tolerant of minor header variations
 * (underscores vs spaces), but does not rely on legacy column names.
 */
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { normalizeMessageThemeAndFormat } from './categorization.js';
import { computeDaysLive, normalizeMosaicBrandCategory, parseAdFormat, parseBool, parseDateFlexible, } from './adNormalize.js';
const COLUMN_ALIASES = {
    adId: ['ad_id', 'ad id'],
    competitorBrand: ['competitor_brand', 'competitor brand'],
    mosaicBrandCategory: ['mosaic_brand_category', 'mosaic brand category'],
    brandType: ['brand_type', 'brand type'],
    competitorType: ['competitor_type', 'competitor type'],
    targetAudience: ['target_audience', 'target audience'],
    platform: ['platform'],
    adFormat: ['ad_format', 'ad format'],
    adType: ['ad_type', 'ad type'],
    messageTheme: ['message_theme', 'message theme'],
    hookType: ['hook_type', 'hook type'],
    hookText: ['hook_text', 'hook text'],
    scrollStopperType: ['scroll_stopper_type', 'scroll stopper type'],
    adFirstSeenDate: ['ad_first_seen_date', 'ad first seen date'],
    adLastSeenDate: ['ad_last_seen_date', 'ad last seen date'],
    daysLive: ['days live', 'days_live'],
    isCurrentlyActive: ['is_currently_active', 'is currently active'],
    monthBucket: ['month_bucket', 'month bucket'],
    funnelStage: ['funnel_stage', 'funnel stage'],
    landingPageType: ['landing_page_type', 'landing page type'],
    cta: ['cta'],
    offerType: ['offer_type', 'offer type'],
    primaryPainPoint: ['primary_pain_point', 'primary pain point'],
    emotionalTrigger: ['emotional_trigger', 'emotional trigger'],
    tone: ['tone'],
    visualStyle: ['visual_style', 'visual style'],
    creatorPresence: ['creator_presence', 'creator presence'],
    doctorOrExpertFeatured: ['doctor_or_expert_featured', 'doctor or expert featured'],
    communityElement: ['community_element', 'community element'],
    memeFormat: ['meme_format', 'meme format'],
    strategicTag: ['strategic_tag', 'strategic tag'],
    creativeUrl: ['creative_url', 'creative url', 'media_url', 'media url'],
    landingPageUrl: ['landing_page_url', 'landing page url', 'destination', 'link'],
};
function normalizeKey(header) {
    const lower = header.trim().toLowerCase();
    for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
        if (lower === canonical.toLowerCase() || aliases.some((a) => a.toLowerCase() === lower)) {
            return canonical;
        }
    }
    return header.trim();
}
export function parseCSVBuffer(buffer) {
    const text = buffer.toString('utf-8');
    const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    const first = rows[0];
    if (!first)
        return [];
    const headerMap = {};
    for (const key of Object.keys(first)) {
        headerMap[normalizeKey(key)] = key;
    }
    const get = (row, canonical) => {
        const original = headerMap[canonical];
        const val = original ? row[original] : row[canonical];
        return (val ?? '').toString().trim();
    };
    const result = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const competitorBrand = get(row, 'competitorBrand');
        const brandName = competitorBrand || 'Unknown';
        const mosaicBrandCategoryRaw = get(row, 'mosaicBrandCategory');
        const mosaicBrandCategory = mosaicBrandCategoryRaw ? normalizeMosaicBrandCategory(mosaicBrandCategoryRaw) : '';
        const firstSeen = parseDateFlexible(get(row, 'adFirstSeenDate'));
        const lastSeen = parseDateFlexible(get(row, 'adLastSeenDate'));
        const isCurrentlyActive = parseBool(get(row, 'isCurrentlyActive'));
        const adFormatRaw = get(row, 'adFormat');
        const adCreativeType = parseAdFormat(adFormatRaw);
        const messageThemeFromCsv = get(row, 'messageTheme');
        const hookText = get(row, 'hookText');
        const adTypeFromCsv = get(row, 'adType');
        const hookTypeFromCsv = get(row, 'hookType');
        const { messageTheme, creativeFormat } = normalizeMessageThemeAndFormat({
            messageThemeFromCsv,
            hookTypeFromCsv,
            adTypeFromCsv,
            hookText,
            adCreativeType,
        });
        // Recalculate dynamically: never trust CSV "Days Live" blindly
        const daysLive = computeDaysLive({ firstSeen, lastSeen, isActive: isCurrentlyActive });
        result.push({
            id: uuidv4(),
            brandName,
            adId: get(row, 'adId') || `row-${i + 1}`,
            adCreativeType,
            adCopy: hookText || get(row, 'adCopy'),
            headline: get(row, 'headline') || hookText,
            cta: get(row, 'cta'),
            startDate: firstSeen,
            endDate: lastSeen,
            platform: get(row, 'platform') || 'Meta',
            creativeUrl: get(row, 'creativeUrl'),
            landingPageUrl: get(row, 'landingPageUrl'),
            daysLive,
            messageTheme,
            creativeFormat,
            competitorBrand: competitorBrand || undefined,
            mosaicBrandCategory: mosaicBrandCategory || undefined,
            brandType: get(row, 'brandType') || undefined,
            competitorType: get(row, 'competitorType') || undefined,
            targetAudience: get(row, 'targetAudience') || undefined,
            adFormat: adFormatRaw || undefined,
            adType: adTypeFromCsv || undefined,
            monthBucket: get(row, 'monthBucket') || undefined,
            hookType: hookTypeFromCsv || undefined,
            hookText: hookText || undefined,
            primaryPainPoint: get(row, 'primaryPainPoint') || undefined,
            emotionalTrigger: get(row, 'emotionalTrigger') || undefined,
            tone: get(row, 'tone') || undefined,
            landingPageType: get(row, 'landingPageType') || undefined,
            scrollStopperType: get(row, 'scrollStopperType') || undefined,
            funnelStage: get(row, 'funnelStage') || undefined,
            offerType: get(row, 'offerType') || undefined,
            visualStyle: get(row, 'visualStyle') || undefined,
            creatorPresence: parseBool(get(row, 'creatorPresence')),
            doctorOrExpertFeatured: parseBool(get(row, 'doctorOrExpertFeatured')),
            communityElement: parseBool(get(row, 'communityElement')),
            memeFormat: parseBool(get(row, 'memeFormat')),
            strategicTag: get(row, 'strategicTag') || undefined,
            adFirstSeenDate: firstSeen || undefined,
            adLastSeenDate: lastSeen || undefined,
            isCurrentlyActive: isCurrentlyActive,
            _raw: row,
        });
    }
    return result;
}
