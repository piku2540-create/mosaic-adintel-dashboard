/**
 * Uses CSV Message Theme / Ad Type / Hook Type when present; otherwise infers from hook text.
 */
const THEME_MAP = {
    'doctor-backed authority': 'doctor-backed authority',
    'doctor backed': 'doctor-backed authority',
    'ugc': 'UGC/testimonial',
    'testimonial': 'UGC/testimonial',
    'problem-solution': 'problem-solution',
    'problem solution': 'problem-solution',
    'discount': 'discount/offer',
    'offer': 'discount/offer',
    'community': 'community storytelling',
    'storytelling': 'community storytelling',
    'educational': 'educational',
    'explainer': 'educational',
};
const FORMAT_MAP = {
    'ugc': 'talking head',
    'founder': 'talking head',
    'testimonial': 'before/after',
    'explainer': 'product demo',
    'scientific': 'product demo',
};
function normalizeTheme(csv, hookType, hookText) {
    const theme = csv || `${hookType ?? ''} ${hookText ?? ''}`;
    const normalized = theme?.trim().toLowerCase() || '';
    const includesAny = (keywords) => keywords.some((kw) => normalized.includes(kw));
    if (!normalized) {
        console.log('[Strategic Cluster] Empty/undefined theme mapped to Other');
        return 'Other';
    }
    // Performance/Benefit
    if (includesAny(['benefit', 'performance', 'result', 'growth', 'improvement', 'effective'])) {
        return 'Performance/Benefit';
    }
    // Offer/Conversion
    if (includesAny(['offer', 'discount', 'price', 'sale', 'bundle', 'combo', 'free', 'bogo', 'save'])) {
        return 'Offer/Conversion';
    }
    // Authority/Trust
    if (includesAny(['trust', 'authority', 'clinical', 'doctor', 'expert', 'certified', 'science', 'proven'])) {
        return 'Authority/Trust';
    }
    // Problem/Pain
    if (includesAny(['pain', 'problem', 'issue', 'damage', 'hair fall', 'acne', 'dull', 'dark circles'])) {
        return 'Problem/Pain';
    }
    // Aspirational/Lifestyle
    if (includesAny(['lifestyle', 'aspirational', 'confidence', 'glow', 'transformation', 'success'])) {
        return 'Aspirational/Lifestyle';
    }
    // Education
    if (includesAny(['education', 'learn', 'awareness', 'guide', 'tips', 'how to'])) {
        return 'Education';
    }
    // Health/Wellness
    if (includesAny(['nutrition', 'immunity', 'development', 'wellness', 'natural', 'healthy'])) {
        return 'Health/Wellness';
    }
    // Parenting
    if (includesAny(['mom', 'parent', 'kids', 'child', 'baby'])) {
        return 'Parenting';
    }
    console.log('[Strategic Cluster] Unmapped Message_Theme classified as Other:', theme);
    return 'Other';
}
function normalizeFormat(adTypeCsv, hookText, adCreativeType) {
    if (adTypeCsv?.trim()) {
        const lower = adTypeCsv.trim().toLowerCase();
        for (const [key, value] of Object.entries(FORMAT_MAP)) {
            if (lower.includes(key))
                return value;
        }
        return adTypeCsv.trim();
    }
    const text = hookText.toLowerCase();
    for (const [key, value] of Object.entries(FORMAT_MAP)) {
        if (text.includes(key))
            return value;
    }
    return adCreativeType === 'Video' ? 'talking head' : 'other';
}
export function normalizeMessageThemeAndFormat(input) {
    return {
        messageTheme: normalizeTheme(input.messageThemeFromCsv, input.hookTypeFromCsv, input.hookText),
        creativeFormat: normalizeFormat(input.adTypeFromCsv, input.hookText, input.adCreativeType),
    };
}
