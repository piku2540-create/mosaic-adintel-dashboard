import type { ParsedAd, BrandSummary, LongevityAd, GapOpportunity, AdCreativeType } from '@/types';

export type SaturationLevel = 'low' | 'medium' | 'high';

export interface ThemeSaturation {
  theme: string;
  count: number;
  share: number;
  saturation: SaturationLevel;
}

export type StrategicThemeCluster =
  | 'Performance/Benefit'
  | 'Problem/Pain'
  | 'Authority/Trust'
  | 'Aspirational/Lifestyle'
  | 'Offer/Conversion'
  | 'Education'
  | 'Emotional'
  | 'Other';

export function clusterMessageTheme(raw: string): StrategicThemeCluster {
  const v = (raw || '').toString().trim().toLowerCase();
  if (!v) return 'Other';

  const has = (...keywords: string[]) => keywords.some((k) => v.includes(k));

  if (has('performance', 'benefit', 'results', 'result', 'growth', 'improve', 'better', 'gain', 'optimize')) {
    return 'Performance/Benefit';
  }
  if (has('pain', 'problem', 'struggle', 'gap', 'issue', 'frustration')) {
    return 'Problem/Pain';
  }
  if (has('doctor', 'expert', 'authority', 'clinical', 'science', 'scientific', 'dermatologist', 'backed', 'proven')) {
    return 'Authority/Trust';
  }
  if (has('lifestyle', 'aspiration', 'aspirational', 'confidence', 'feel', 'look', 'style')) {
    return 'Aspirational/Lifestyle';
  }
  if (has('discount', 'offer', 'sale', 'deal', 'save', '% off', 'off ', 'free', 'limited time', 'today only', 'now')) {
    return 'Offer/Conversion';
  }
  if (has('educational', 'education', 'tips', 'how to', 'guide', 'explainer', 'learn', 'tutorial')) {
    return 'Education';
  }
  if (has('emotional', 'hope', 'fear', 'anxiety', 'joy', 'happy', 'happiness', 'love', 'urgent', 'urgency')) {
    return 'Emotional';
  }

  return 'Other';
}

export function computeThemeSaturation(ads: ParsedAd[]): ThemeSaturation[] {
  if (!ads.length) return [];

  const counts: Record<string, number> = {};
  for (const ad of ads) {
    const raw = (ad.messageTheme || '').toString().trim();
    const theme = raw ? raw : 'Unknown';
    counts[theme] = (counts[theme] || 0) + 1;
  }

  const total = ads.length;
  const result: ThemeSaturation[] = [];

  const themes = Object.keys(counts).sort((a, b) => a.localeCompare(b));
  for (const theme of themes) {
    const count = counts[theme] || 0;
    const share = total ? count / total : 0;
    let saturation: SaturationLevel = 'medium';
    if (share < 0.15) saturation = 'low';
    else if (share > 0.35) saturation = 'high';
    result.push({ theme, count, share, saturation });
  }

  return result.sort((a, b) => b.share - a.share);
}

export function computeClusterSaturation(ads: ParsedAd[]): ThemeSaturation[] {
  if (!ads.length) return [];

  const counts: Record<string, number> = {};
  for (const ad of ads) {
    const cluster = clusterMessageTheme(ad.messageTheme || '');
    counts[cluster] = (counts[cluster] || 0) + 1;
  }

  const total = ads.length;
  const result: ThemeSaturation[] = [];

  const clusters = Object.keys(counts).sort((a, b) => a.localeCompare(b));
  for (const cluster of clusters) {
    const count = counts[cluster] || 0;
    const share = total ? count / total : 0;
    let saturation: SaturationLevel = 'medium';
    if (share < 0.15) saturation = 'low';
    else if (share > 0.35) saturation = 'high';
    result.push({ theme: cluster, count, share, saturation });
  }

  return result.sort((a, b) => b.share - a.share);
}

export function getBrandColorPalette(_mosaicBrandCategory: string): string[] {
  return [
    '#6EE7B7',
    '#34D399',
    '#A7F3D0',
    '#93C5FD',
    '#C7D2FE',
    '#FDE68A',
  ];
}

export interface ActionRecommendation {
  id: string;
  title: string;
  detail: string;
  category: 'theme' | 'format' | 'longevity' | 'gap' | 'brand' | 'funnel' | 'emotion' | 'cta' | 'pain';
}

export function generateActionRecommendations(input: {
  ads: ParsedAd[];
  summaries: BrandSummary[];
  longevity: LongevityAd[];
  gaps: GapOpportunity[];
  mosaicBrandCategory: string;
}): ActionRecommendation[] {
  const { ads, summaries, longevity, gaps, mosaicBrandCategory } = input;
  const recs: ActionRecommendation[] = [];

  const themeSat = computeClusterSaturation(ads);
  const totalAds = ads.length;
  const countBy = (key: keyof ParsedAd) => {
    const map = new Map<string, number>();
    for (const ad of ads) {
      const raw = (ad[key] as string | undefined)?.trim();
      if (!raw) continue;
      const v = raw.toLowerCase();
      map.set(v, (map.get(v) || 0) + 1);
    }
    return map;
  };

  const funnelMap = countBy('funnelStage');
  const emoMap = countBy('emotionalTrigger');
  const painMap = countBy('primaryPainPoint');
  const ctaMap = countBy('cta');

  // Underused themes
  for (const t of themeSat.filter((t) => t.saturation === 'low' && t.count > 0)) {
    recs.push({
      id: `underused-${t.theme}`,
      category: 'theme',
      title: `${capitalize(t.theme)} theme underused`,
      detail: `${prefixForMosaic(mosaicBrandCategory)}${capitalize(
        t.theme
      )} appears in only ${(t.share * 100).toFixed(0)}% of ads (${t.count} of ${totalAds}). Test new creatives that lean into this angle.`,
    });
  }

  // Completely missing themes
  for (const t of themeSat.filter((t) => t.count === 0)) {
    recs.push({
      id: `missing-${t.theme}`,
      category: 'theme',
      title: `${capitalize(t.theme)} not yet tested`,
      detail: `${prefixForMosaic(mosaicBrandCategory)}No ads currently use ${t.theme} messaging. Launch 1–2 experiments to validate this storyline.`,
    });
  }

  // Overused / saturated themes
  const saturated = themeSat.find((t) => t.saturation === 'high');
  if (saturated) {
    recs.push({
      id: `saturated-${saturated.theme}`,
      category: 'theme',
      title: `${capitalize(saturated.theme)} saturation is high`,
      detail: `${prefixForMosaic(
        mosaicBrandCategory
      )}${capitalize(saturated.theme)} accounts for ${(saturated.share * 100).toFixed(
        0
      )}% of all ads. Shift a portion of budget into complementary themes (e.g. problem-solution or community storytelling).`,
    });
  }

  // Format longevity comparison
  if (ads.length) {
    const byFormat: Record<
      AdCreativeType,
      { count: number; totalDays: number }
    > = {
      Static: { count: 0, totalDays: 0 },
      Video: { count: 0, totalDays: 0 },
      Carousel: { count: 0, totalDays: 0 },
    };

    for (const ad of ads) {
      const bucket = byFormat[ad.adCreativeType as AdCreativeType];
      if (!bucket) continue;
      bucket.count += 1;
      bucket.totalDays += ad.daysLive;
    }

    const formatAvgs = (Object.keys(byFormat) as AdCreativeType[])
      .filter((f) => byFormat[f].count > 0)
      .map((f) => ({
        format: f,
        avg: byFormat[f].totalDays / byFormat[f].count,
      }))
      .sort((a, b) => b.avg - a.avg);

    if (formatAvgs.length >= 2) {
      const best = formatAvgs[0];
      const second = formatAvgs[1];
      if (best.avg - second.avg >= 3) {
        recs.push({
          id: `format-avg-${best.format}`,
          category: 'format',
          title: `${best.format} ads show stronger longevity`,
          detail: `${prefixForMosaic(
            mosaicBrandCategory
          )}${best.format} ads average ${best.avg.toFixed(
            1
          )} days live vs ${second.format} at ${second.avg.toFixed(
            1
          )} days. Consider scaling ${best.format.toLowerCase()} spend.`,
        });
      }
    }
  }

  // Longest running winners
  const winners = longevity.filter((l) => l.daysLive >= 30).slice(0, 3);
  if (winners.length) {
    const best = winners[0];
    recs.push({
      id: `winner-${best.ad.adId}`,
      category: 'longevity',
      title: 'Scale proven long-running winners',
      detail: `${prefixForMosaic(
        mosaicBrandCategory
      )}${winners.length} ads have been live for 30+ days. Top example: ${best.ad.brandName} ${best.ad.adCreativeType.toLowerCase()} (${best.daysLive} days). Duplicate angles into new formats and audiences.`,
    });
  }

  // Gap opportunities from backend
  if (gaps.length) {
    const topGap = gaps[0];
    recs.push({
      id: `gap-${topGap.description}`,
      category: 'gap',
      title: topGap.description,
      detail: `${topGap.opportunity} Currently used by ${topGap.competitorsUsing.length || 0} competitor(s); low adoption makes it a differentiated play.`,
    });
  }

  // Brand-level mix recommendation
  if (summaries.length >= 2) {
    const sorted = [...summaries].sort((a, b) => b.avgDaysLive - a.avgDaysLive);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best && worst && best.avgDaysLive - worst.avgDaysLive >= 3) {
      recs.push({
        id: `brand-mix-${best.brandName}`,
        category: 'brand',
        title: `${best.brandName} playbook outperforms peers`,
        detail: `${best.brandName} ads average ${best.avgDaysLive} days live vs ${worst.brandName} at ${worst.avgDaysLive} days. Borrow high-performing hooks and formats from ${best.brandName} for the weaker brands.`,
      });
    }
  }

  // Funnel-stage coverage: ensure purchase stage exists
  if (totalAds > 0) {
    const purchase = funnelMap.get('purchase') || 0;
    if (purchase === 0) {
      recs.push({
        id: 'funnel-purchase-missing',
        category: 'funnel',
        title: 'Purchase-stage creatives missing',
        detail: `${prefixForMosaic(
          mosaicBrandCategory
        )}no ads are tagged as Purchase. Add conversion-focused creatives (offer-led, urgency CTAs) to close the journey.`,
      });
    }
  }

  // Emotional trigger saturation
  if (emoMap.size) {
    const sorted = Array.from(emoMap.entries()).sort((a, b) => b[1] - a[1]);
    const [topEmo, topCount] = sorted[0];
    const share = totalAds ? (topCount / totalAds) * 100 : 0;
    if (share >= 40) {
      recs.push({
        id: `emotion-saturated-${topEmo}`,
        category: 'emotion',
        title: `${capitalize(topEmo)} emotional trigger overused`,
        detail: `${prefixForMosaic(
          mosaicBrandCategory
        )}${capitalize(topEmo)} appears in ${share.toFixed(
          0
        )}% of ads. Test contrasting triggers (e.g. aspiration, authority, or hope) to avoid fatigue.`,
      });
    }
    if (!emoMap.get('authority')) {
      recs.push({
        id: 'emotion-authority-missing',
        category: 'emotion',
        title: 'No authority-driven hooks detected',
        detail: `${prefixForMosaic(
          mosaicBrandCategory
        )}no ads lean on authority-led triggers (doctors, experts, social proof). Introduce 1–2 authority-led variants to strengthen trust.`,
      });
    }
  }

  // Pain-point dominance
  if (painMap.size >= 2) {
    const sortedPain = Array.from(painMap.entries()).sort((a, b) => b[1] - a[1]);
    const [topPain, topCount] = sortedPain[0];
    const share = totalAds ? (topCount / totalAds) * 100 : 0;
    if (share >= 60) {
      recs.push({
        id: `pain-dominant-${topPain}`,
        category: 'pain',
        title: `${capitalize(topPain)} dominates messaging`,
        detail: `${prefixForMosaic(
          mosaicBrandCategory
        )}${capitalize(topPain)} drives ${share.toFixed(
          0
        )}% of ads. Explore secondary narratives like stress, self-confidence, or lifestyle to open new whitespace.`,
      });
    }
  }

  // CTA variety
  if (ctaMap.size) {
    const uniqueCtas = Array.from(ctaMap.keys());
    if (uniqueCtas.length === 1) {
      const only = uniqueCtas[0];
      recs.push({
        id: `cta-single-${only}`,
        category: 'cta',
        title: `CTA "${only}" used exclusively`,
        detail: `${prefixForMosaic(
          mosaicBrandCategory
        )}all creatives use "${only}" as the only CTA. Test alternative CTAs (e.g. learn more, sign up) to match different funnel intents.`,
      });
    }
  }

  return recs.slice(0, 7);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function prefixForMosaic(mosaicBrandCategory: string): string {
  if (!mosaicBrandCategory || mosaicBrandCategory === 'All') return '';
  return `Within the ${mosaicBrandCategory} competitive set, `;
}

// AIDA funnel analytics

export type AIDAStage = 'Awareness' | 'Interest' | 'Desire' | 'Action';

export interface AidaStageMetric {
  stage: AIDAStage;
  count: number;
  share: number;
}

export interface AidaFunnelInsights {
  stages: AidaStageMetric[];
  overReliance?: { stage: AIDAStage; share: number };
  weakTopFunnel: boolean;
  weakBottomFunnel: boolean;
  compression: {
    ratio: number | null;
    label: 'Poor' | 'Balanced' | 'Strong' | 'Unknown';
  };
}

export function normalizeToAida(rawStage: string | undefined, messageTheme: string | undefined): AIDAStage {
  const normalized = rawStage?.trim().toLowerCase() || '';
  if (normalized) {
    if (normalized === 'awareness') return 'Awareness';
    if (normalized === 'consideration') return 'Interest';
    if (normalized === 'conversion' || normalized === 'purchase') return 'Action';
    if (normalized === 'intent' || normalized === 'evaluation') return 'Desire';
  }

  const cluster = clusterMessageTheme(messageTheme || '');
  switch (cluster) {
    case 'Performance/Benefit':
      return 'Desire';
    case 'Offer/Conversion':
      return 'Action';
    case 'Authority/Trust':
      return 'Interest';
    case 'Problem/Pain':
      return 'Awareness';
    case 'Aspirational/Lifestyle':
      return 'Desire';
    case 'Education':
      return 'Interest';
    default:
      return 'Awareness';
  }
}

export function computeAidaFunnel(ads: ParsedAd[]): AidaFunnelInsights {
  const counts: Record<AIDAStage, number> = {
    Awareness: 0,
    Interest: 0,
    Desire: 0,
    Action: 0,
  };

  for (const ad of ads) {
    const stage = normalizeToAida(ad.funnelStage, ad.messageTheme);
    counts[stage] += 1;
  }

  const total = ads.length || 0;
  const stages: AidaStageMetric[] = (['Awareness', 'Interest', 'Desire', 'Action'] as AIDAStage[]).map((stage) => {
    const count = counts[stage] || 0;
    const share = total ? count / total : 0;
    return { stage, count, share };
  });

  const overReliance = (() => {
    if (!total) return undefined;
    const max = stages.reduce((acc, s) => (s.share > acc.share ? s : acc), stages[0]);
    return max.share > 0.5 ? { stage: max.stage, share: max.share } : undefined;
  })();

  const awarenessShare = stages.find((s) => s.stage === 'Awareness')?.share ?? 0;
  const actionShare = stages.find((s) => s.stage === 'Action')?.share ?? 0;
  const interestShare = stages.find((s) => s.stage === 'Interest')?.share ?? 0;

  let ratio: number | null = null;
  let label: AidaFunnelInsights['compression']['label'] = 'Unknown';
  if (interestShare > 0) {
    ratio = actionShare / interestShare;
    if (ratio < 0.5) label = 'Poor';
    else if (ratio <= 0.8) label = 'Balanced';
    else label = 'Strong';
  }

  return {
    stages,
    overReliance,
    weakTopFunnel: awarenessShare > 0 && awarenessShare < 0.15,
    weakBottomFunnel: actionShare > 0 && actionShare < 0.15,
    compression: { ratio, label },
  };
}

// Longevity intelligence

export interface LongevitySummary {
  overallAvg: number;
  byFormat: { format: AdCreativeType; avg: number }[];
  byCluster: { cluster: StrategicThemeCluster; avg: number }[];
  highRetentionIds: Set<string>;
}

export function computeLongevitySummary(ads: ParsedAd[]): LongevitySummary {
  if (!ads.length) {
    return {
      overallAvg: 0,
      byFormat: [],
      byCluster: [],
      highRetentionIds: new Set<string>(),
    };
  }

  const totalDays = ads.reduce((acc, a) => acc + (a.daysLive || 0), 0);
  const overallAvg = totalDays / ads.length;

  const byFormatMap: Record<AdCreativeType, { total: number; count: number }> = {
    Static: { total: 0, count: 0 },
    Video: { total: 0, count: 0 },
    Carousel: { total: 0, count: 0 },
  };

  const byClusterMap: Record<StrategicThemeCluster, { total: number; count: number }> = {
    'Performance/Benefit': { total: 0, count: 0 },
    'Problem/Pain': { total: 0, count: 0 },
    'Authority/Trust': { total: 0, count: 0 },
    'Aspirational/Lifestyle': { total: 0, count: 0 },
    'Offer/Conversion': { total: 0, count: 0 },
    Education: { total: 0, count: 0 },
    Emotional: { total: 0, count: 0 },
    Other: { total: 0, count: 0 },
  };

  const highRetentionIds = new Set<string>();

  for (const ad of ads) {
    const days = ad.daysLive || 0;
    const fmt = ad.adCreativeType as AdCreativeType;
    const cluster = clusterMessageTheme(ad.messageTheme || '');

    if (byFormatMap[fmt]) {
      byFormatMap[fmt].total += days;
      byFormatMap[fmt].count += 1;
    }
    if (byClusterMap[cluster]) {
      byClusterMap[cluster].total += days;
      byClusterMap[cluster].count += 1;
    }

    if (overallAvg > 0 && days / overallAvg > 1.5) {
      highRetentionIds.add(ad.id);
    }
  }

  const byFormat = (Object.keys(byFormatMap) as AdCreativeType[])
    .filter((f) => byFormatMap[f].count > 0)
    .map((f) => ({
      format: f,
      avg: byFormatMap[f].total / byFormatMap[f].count,
    }))
    .sort((a, b) => b.avg - a.avg);

  const byCluster = (Object.keys(byClusterMap) as StrategicThemeCluster[])
    .filter((c) => byClusterMap[c].count > 0)
    .map((c) => ({
      cluster: c,
      avg: byClusterMap[c].total / byClusterMap[c].count,
    }))
    .sort((a, b) => b.avg - a.avg);

  return {
    overallAvg,
    byFormat,
    byCluster,
    highRetentionIds,
  };
}

// Gap usage from ads (emotional / funnel / CTA)

export interface GapUsage {
  key: string;
  type: 'Emotional' | 'Funnel' | 'CTA';
  count: number;
  pct: number;
  priority: 1 | 2 | 3;
  confidence: 'High' | 'Medium' | 'Low';
}

export function computeGapUsageFromAds(ads: ParsedAd[]): {
  emotional: GapUsage[];
  funnel: GapUsage[];
  cta: GapUsage[];
} {
  const total = ads.length || 0;
  if (!total) return { emotional: [], funnel: [], cta: [] };

  const norm = (v: unknown): string =>
    v === null || v === undefined ? '' : String(v).trim().toLowerCase();

  const emotionalMap = new Map<string, number>();
  const funnelMap = new Map<AIDAStage, number>();
  const ctaMap = new Map<string, number>();

  for (const ad of ads) {
    const emo = norm(ad.emotionalTrigger);
    if (emo) emotionalMap.set(emo, (emotionalMap.get(emo) || 0) + 1);

    const stage = normalizeToAida(ad.funnelStage, ad.messageTheme);
    funnelMap.set(stage, (funnelMap.get(stage) || 0) + 1);

    const cta = norm(ad.cta);
    if (cta) ctaMap.set(cta, (ctaMap.get(cta) || 0) + 1);
  }

  const classify = (pct: number): { priority: 1 | 2 | 3; confidence: 'High' | 'Medium' | 'Low' } => {
    if (pct === 0) return { priority: 1, confidence: 'High' };
    if (pct < 5) return { priority: 1, confidence: 'High' };
    if (pct < 10) return { priority: 2, confidence: 'Medium' };
    return { priority: 3, confidence: 'Low' };
  };

  const build = <T extends string>(
    entries: [T, number][],
    type: GapUsage['type'],
  ): GapUsage[] => {
    const rows = entries
      .map(([key, count]) => {
        const pct = (count / total) * 100;
        const { priority, confidence } = classify(pct);
        return {
          key,
          type,
          count,
          pct,
          priority,
          confidence,
        } as GapUsage;
      })
      .filter((g) => g.pct < 10)
      .sort((a, b) => a.pct - b.pct || a.count - b.count);
    return rows;
  };

  const emotional = build(Array.from(emotionalMap.entries()) as [string, number][], 'Emotional');
  const funnel = build(Array.from(funnelMap.entries()) as [AIDAStage, number][], 'Funnel');
  const cta = build(Array.from(ctaMap.entries()) as [string, number][], 'CTA');

  return { emotional, funnel, cta };
}

// Pain vs offer analytics

export interface PainOfferDataRow {
  name: string;
  pain: number;
  offer: number;
}

export interface PainOfferInsights {
  rows: PainOfferDataRow[];
  topCombos: { pain: string; offer: string; count: number }[];
  orphanPains: string[];
  orphanOffers: string[];
}

export function computePainOfferInsights(ads: ParsedAd[]): PainOfferInsights {
  const painCounts: Record<string, number> = {};
  const offerCounts: Record<string, number> = {};
  const comboCounts: Record<string, number> = {};
  const painLabel: Record<string, string> = {};
  const offerLabel: Record<string, string> = {};

  const norm = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim().toLowerCase());

  for (const ad of ads) {
    const painRaw = (ad.primaryPainPoint || '').trim();
    const offerRaw = (ad.offerType || '').trim();
    const painKey = norm(painRaw);
    const offerKey = norm(offerRaw);

    if (painKey) {
      painCounts[painKey] = (painCounts[painKey] || 0) + 1;
      painLabel[painKey] = painLabel[painKey] || painRaw;
    }
    if (offerKey) {
      offerCounts[offerKey] = (offerCounts[offerKey] || 0) + 1;
      offerLabel[offerKey] = offerLabel[offerKey] || offerRaw;
    }
    if (painKey && offerKey) {
      const comboKey = `${painKey}||${offerKey}`;
      comboCounts[comboKey] = (comboCounts[comboKey] || 0) + 1;
    }
  }

  const labels = Array.from(new Set([...Object.keys(painCounts), ...Object.keys(offerCounts)]));
  const rows: PainOfferDataRow[] = labels.map((key) => ({
    name: painLabel[key] || offerLabel[key] || key,
    pain: painCounts[key] || 0,
    offer: offerCounts[key] || 0,
  }));

  const topCombos = Object.entries(comboCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => {
      const [painKey, offerKey] = key.split('||');
      return {
        pain: painLabel[painKey] || painKey,
        offer: offerLabel[offerKey] || offerKey,
        count,
      };
    });

  const painsWithOffer = new Set<string>();
  const offersWithPain = new Set<string>();
  for (const comboKey of Object.keys(comboCounts)) {
    const [painKey, offerKey] = comboKey.split('||');
    painsWithOffer.add(painKey);
    offersWithPain.add(offerKey);
  }

  const orphanPains = Object.keys(painCounts)
    .filter((p) => !painsWithOffer.has(p))
    .map((p) => painLabel[p] || p);

  const orphanOffers = Object.keys(offerCounts)
    .filter((o) => !offersWithPain.has(o))
    .map((o) => offerLabel[o] || o);

  return { rows, topCombos, orphanPains, orphanOffers };
}

// Tiered action system

export type RecommendationTier = 'immediate' | 'test_expand' | 'strategic';

export interface TieredActionRecommendation extends ActionRecommendation {
  tier: RecommendationTier;
}

export function generateTieredActionRecommendations(input: {
  ads: ParsedAd[];
  summaries: BrandSummary[];
  longevity: LongevityAd[];
  gaps: GapOpportunity[];
  mosaicBrandCategory: string;
}): TieredActionRecommendation[] {
  const { ads, longevity, mosaicBrandCategory } = input;
  const totalAds = ads.length || 0;
  const recs: TieredActionRecommendation[] = [];

  if (!totalAds) return recs;

  const themeClusters = computeClusterSaturation(ads);
  const longevitySummary = computeLongevitySummary(ads);
  const aida = computeAidaFunnel(ads);
  const gapsFromAds = computeGapUsageFromAds(ads);

  const countBy = (key: keyof ParsedAd) => {
    const map = new Map<string, number>();
    for (const ad of ads) {
      const raw = (ad[key] as string | undefined)?.trim();
      if (!raw) continue;
      const v = raw.toLowerCase();
      map.set(v, (map.get(v) || 0) + 1);
    }
    return map;
  };

  const emoMap = countBy('emotionalTrigger');

  // Immediate Scale
  if (longevitySummary.highRetentionIds.size > 0) {
    const example = ads.find((a) => longevitySummary.highRetentionIds.has(a.id));
    recs.push({
      id: 'immediate-longevity',
      tier: 'immediate',
      category: 'longevity',
      title: 'Scale high-retention creatives',
      detail:
        example && longevitySummary.overallAvg
          ? `Overall average days live is ${longevitySummary.overallAvg.toFixed(
              1,
            )}. ${example.brandName} ${example.adCreativeType} has run for ${
              example.daysLive
            } days, ${(
              example.daysLive / longevitySummary.overallAvg
            ).toFixed(1)}x longer than average.`
          : 'Several creatives substantially outperform the average days live. Increase budgets and mirror their patterns in new variants.',
    });
  }

  const balancedCluster = themeClusters.find((t) => t.share >= 0.15 && t.share <= 0.35);
  if (balancedCluster) {
    recs.push({
      id: `immediate-balanced-${balancedCluster.theme}`,
      tier: 'immediate',
      category: 'theme',
      title: 'Lean into balanced themes',
      detail: `${prefixForMosaic(mosaicBrandCategory)}${balancedCluster.theme} appears in ${(
        balancedCluster.share * 100
      ).toFixed(0)}% of ads (${balancedCluster.count} of ${totalAds}).`,
    });
  }

  if (aida.compression.ratio !== null) {
    recs.push({
      id: 'immediate-compression',
      tier: 'immediate',
      category: 'funnel',
      title: 'Monitor funnel compression',
      detail: `AIDA compression index (Action / Interest) is ${aida.compression.ratio.toFixed(
        2,
      )} — ${aida.compression.label}.`,
    });
  }

  // Test & Expand
  const whitespace = themeClusters
    .filter((t) => t.share < 0.1 && t.count > 0)
    .sort((a, b) => a.share - b.share)[0];
  if (whitespace) {
    recs.push({
      id: `test-whitespace-${whitespace.theme}`,
      tier: 'test_expand',
      category: 'theme',
      title: 'Activate white-space themes',
      detail: `${prefixForMosaic(mosaicBrandCategory)}${whitespace.theme} appears in ${(
        whitespace.share * 100
      ).toFixed(1)}% of ads (${whitespace.count} of ${totalAds}).`,
    });
  }

  const mediumCtaGap = gapsFromAds.cta.find((g) => g.priority === 2);
  if (mediumCtaGap) {
    recs.push({
      id: `test-cta-${mediumCtaGap.key}`,
      tier: 'test_expand',
      category: 'cta',
      title: 'Broaden CTA mix',
      detail: `${prefixForMosaic(
        mosaicBrandCategory,
      )}"${mediumCtaGap.key}" appears in ${mediumCtaGap.pct.toFixed(1)}% of ads (${mediumCtaGap.count} of ${totalAds}).`,
    });
  }

  // Strategic Fix
  if (aida.overReliance) {
    recs.push({
      id: `strategic-funnel-${aida.overReliance.stage}`,
      tier: 'strategic',
      category: 'funnel',
      title: 'Rebalance AIDA coverage',
      detail: `${prefixForMosaic(
        mosaicBrandCategory,
      )}${aida.overReliance.stage} accounts for ${(aida.overReliance.share * 100).toFixed(
        0,
      )}% of creatives.`,
    });
  }

  if (aida.weakTopFunnel) {
    recs.push({
      id: 'strategic-top-funnel',
      tier: 'strategic',
      category: 'funnel',
      title: 'Strengthen top-of-funnel',
      detail: 'Awareness-stage creatives represent less than 15% of the portfolio.',
    });
  }

  if (aida.weakBottomFunnel) {
    recs.push({
      id: 'strategic-bottom-funnel',
      tier: 'strategic',
      category: 'funnel',
      title: 'Reinforce action-stage',
      detail: 'Action-stage creatives represent less than 15% of the portfolio.',
    });
  }

  if (emoMap.size) {
    const emoEntries = Array.from(emoMap.entries());
    const lowEmos = emoEntries
      .map(([key, count]) => ({
        key,
        count,
        pct: (count / totalAds) * 100,
      }))
      .filter((e) => e.pct < 5)
      .sort((a, b) => a.pct - b.pct);

    const underused = lowEmos[0];
    if (underused) {
      recs.push({
        id: `strategic-emotion-${underused.key}`,
        tier: 'strategic',
        category: 'emotion',
        title: 'Broaden emotional triggers',
        detail: `${prefixForMosaic(
          mosaicBrandCategory,
        )}${capitalize(underused.key)} appears in ${underused.pct.toFixed(1)}% of ads (${
          underused.count
        } of ${totalAds}).`,
      });
    }
  }

  if (longevity.length === 0 && totalAds > 0) {
    recs.push({
      id: 'strategic-longevity-coverage',
      tier: 'strategic',
      category: 'longevity',
      title: 'Improve longevity tracking',
      detail: 'Longevity insights are limited for the current slice. Widen date range to understand true retention.',
    });
  }

  return recs;
}

