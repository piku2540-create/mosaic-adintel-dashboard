import { v4 as uuidv4 } from 'uuid';
import { normalizeMessageThemeAndFormat } from './categorization.js';
import { computeDaysLive, normalizeMosaicBrandCategory, parseAdFormat, parseBool, parseDateFlexible, } from './adNormalize.js';
function getString(row, key) {
    const v = row[key];
    if (v === null || v === undefined)
        return '';
    return String(v).trim();
}
export function parseMetaAdsJson(input) {
    if (!Array.isArray(input))
        return [];
    const result = [];
    for (let i = 0; i < input.length; i++) {
        const row = input[i];
        if (typeof row !== 'object' || row === null)
            continue;
        const r = row;
        const competitorBrand = getString(r, 'Competitor_Brand');
        const brandName = competitorBrand || 'Unknown';
        const mosaicBrandCategoryRaw = getString(r, 'Mosaic_Brand_Category');
        const mosaicBrandCategory = mosaicBrandCategoryRaw
            ? normalizeMosaicBrandCategory(mosaicBrandCategoryRaw)
            : '';
        const firstSeen = parseDateFlexible(getString(r, 'Ad_First_Seen_Date'));
        const lastSeen = parseDateFlexible(getString(r, 'Ad_Last_Seen_Date'));
        const isCurrentlyActive = parseBool(getString(r, 'Is_Currently_Active'));
        const adFormatRaw = getString(r, 'Ad_Format');
        const adCreativeType = parseAdFormat(adFormatRaw);
        const messageThemeFromCsv = getString(r, 'Message_Theme');
        const hookText = getString(r, 'Hook_Text');
        const adTypeFromCsv = getString(r, 'Ad_Type');
        const hookTypeFromCsv = getString(r, 'Hook_Type');
        const { messageTheme, creativeFormat } = normalizeMessageThemeAndFormat({
            messageThemeFromCsv,
            hookTypeFromCsv,
            adTypeFromCsv,
            hookText,
            adCreativeType,
        });
        const daysLive = computeDaysLive({ firstSeen, lastSeen, isActive: isCurrentlyActive });
        const adId = getString(r, 'Ad_ID') || `row-${i + 1}`;
        const cta = getString(r, 'CTA');
        result.push({
            id: uuidv4(),
            brandName,
            adId,
            adCreativeType,
            adCopy: hookText,
            headline: hookText,
            cta,
            startDate: firstSeen,
            endDate: lastSeen,
            platform: getString(r, 'Platform') || 'Meta',
            creativeUrl: '',
            landingPageUrl: '',
            daysLive,
            messageTheme,
            creativeFormat,
            competitorBrand: competitorBrand || undefined,
            mosaicBrandCategory: mosaicBrandCategory || undefined,
            brandType: getString(r, 'Brand_Type') || undefined,
            competitorType: getString(r, 'Competitor_Type') || undefined,
            targetAudience: getString(r, 'Target_Audience') || undefined,
            adFormat: adFormatRaw || undefined,
            adType: adTypeFromCsv || undefined,
            monthBucket: getString(r, 'Month_Bucket') || undefined,
            hookType: hookTypeFromCsv || undefined,
            hookText: hookText || undefined,
            primaryPainPoint: getString(r, 'Primary_Pain_Point') || undefined,
            emotionalTrigger: getString(r, 'Emotional_Trigger') || undefined,
            tone: getString(r, 'Tone') || undefined,
            landingPageType: getString(r, 'Landing_Page_Type') || undefined,
            scrollStopperType: getString(r, 'Scroll_Stopper_Type') || undefined,
            funnelStage: getString(r, 'Funnel_Stage') || undefined,
            offerType: getString(r, 'Offer_Type') || undefined,
            visualStyle: getString(r, 'Visual_Style') || undefined,
            creatorPresence: parseBool(getString(r, 'Creator_Presence')),
            doctorOrExpertFeatured: parseBool(getString(r, 'Doctor_or_Expert_Featured')),
            communityElement: parseBool(getString(r, 'Community_Element')),
            memeFormat: parseBool(getString(r, 'Meme_Format')),
            strategicTag: getString(r, 'Strategic_Tag') || undefined,
            adFirstSeenDate: firstSeen || undefined,
            adLastSeenDate: lastSeen || undefined,
            isCurrentlyActive: isCurrentlyActive,
        });
    }
    return result;
}
