import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UploadModal } from '@/components/UploadModal';
import { FiltersBar, type FilterState } from '@/components/FiltersBar';
import { OverviewKPIs } from '@/components/Dashboard/OverviewKPIs';
import { AdFormatDistribution } from '@/components/Dashboard/AdFormatDistribution';
import { MessageThemeTrends } from '@/components/Dashboard/MessageThemeTrends';
import { LongestRunningAds } from '@/components/Dashboard/LongestRunningAds';
import { GapOpportunities } from '@/components/Dashboard/GapOpportunities';
import { AIWeeklyBrief } from '@/components/Dashboard/AIWeeklyBrief';
import { CreativeSaturation } from '@/components/Dashboard/CreativeSaturation';
import { FunnelStageDistribution } from '@/components/Dashboard/FunnelStageDistribution';
import { PainPointOfferChart } from '@/components/Dashboard/PainPointOfferChart';
import { ActionRecommendations } from '@/components/Dashboard/ActionRecommendations';
import { CreativeStrengthIntelligence } from '@/components/Dashboard/CreativeStrengthIntelligence';
import { CompetitiveAggressionIndex } from '@/components/Dashboard/CompetitiveAggressionIndex';
import { EmotionIntelligenceMatrix } from '@/components/Dashboard/EmotionIntelligenceMatrix';
import { PainOfferAlignmentIntelligence } from '@/components/Dashboard/PainOfferAlignmentIntelligence';
import { StrategicSnapshot } from '@/components/Dashboard/StrategicSnapshot';
import {
  getBrands,
  getAIInsights,
  getAds,
  type DashboardFilters,
} from '@/lib/api';
import type {
  BrandSummary,
  LongevityAd,
  GapOpportunity,
  AIInsightsPayload,
  ParsedAd,
  CreativeStrengthResult,
  CompetitorAggressionResult,
  EmotionFormatMatrixResult,
  PainOfferAlignmentResult,
} from '@/types';

const defaultFilters: FilterState = {
  brands: [],
  adTypes: [],
  messageThemes: [],
  adTypeFilter: [],
  dateFrom: '',
  dateTo: '',
  mosaicBrandCategory: 'All',
};

export default function App() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [summaries, setSummaries] = useState<BrandSummary[]>([]);
  const [longevity, setLongevity] = useState<LongevityAd[]>([]);
  const [gaps, setGaps] = useState<GapOpportunity[]>([]);
  const [aiPayload, setAiPayload] = useState<AIInsightsPayload | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datasetAds, setDatasetAds] = useState<ParsedAd[]>([]);
  const [ads, setAds] = useState<ParsedAd[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [themeViewMode, setThemeViewMode] = useState<'raw' | 'cluster'>('cluster');
  const [creativeStrength, setCreativeStrength] = useState<CreativeStrengthResult | null>(null);
  const [aggression, setAggression] = useState<CompetitorAggressionResult | null>(null);
  const [emotionFormat, setEmotionFormat] = useState<EmotionFormatMatrixResult | null>(null);
  const [painOfferAlignment, setPainOfferAlignment] = useState<PainOfferAlignmentResult | null>(null);

  const devLog = useCallback((...args: any[]) => {
    if (import.meta.env.DEV) console.log(...args);
  }, []);

  const norm = (v: unknown): string =>
    v === null || v === undefined ? '' : String(v).trim().toLowerCase().replace(/\s+/g, ' ');

  function extractBrands(list: ParsedAd[], mosaicBrandCategory?: string): string[] {
    const set = new Set<string>();
    const target = mosaicBrandCategory && mosaicBrandCategory !== 'All' ? norm(mosaicBrandCategory) : '';
    for (const ad of list) {
      if (target && norm(ad.mosaicBrandCategory) !== target) continue;
      if (ad.brandName) set.add(ad.brandName);
    }
    return Array.from(set).sort();
  }

  function extractMessageThemes(list: ParsedAd[], opts: { mosaicBrandCategory?: string; filters: FilterState }): string[] {
    const themes = new Set<string>();

    const mosaicTarget =
      opts.mosaicBrandCategory && opts.mosaicBrandCategory !== 'All' ? norm(opts.mosaicBrandCategory) : '';

    for (const ad of list) {
      if (mosaicTarget && norm(ad.mosaicBrandCategory) !== mosaicTarget) continue;

      if (opts.filters.brands.length && !opts.filters.brands.includes(ad.brandName)) continue;
      if (opts.filters.adTypes.length && !opts.filters.adTypes.includes(ad.adCreativeType)) continue;
      if (opts.filters.adTypeFilter.length && (!ad.adType || !opts.filters.adTypeFilter.includes(ad.adType))) continue;

      const d = (ad.adFirstSeenDate || ad.startDate || '').toString();
      if (opts.filters.dateFrom && d && d < opts.filters.dateFrom) continue;
      if (opts.filters.dateTo && d && d > opts.filters.dateTo) continue;

      const t = (ad.messageTheme || '').toString().trim();
      themes.add(t || 'Unknown');
    }

    return Array.from(themes).sort((a, b) => a.localeCompare(b));
  }

  function parseMetaAdsResponse(json: unknown): ParsedAd[] {
    const data = Array.isArray(json) ? json : (json as { data?: unknown })?.data;
    if (!Array.isArray(data)) throw new Error('Invalid response shape');
    return data as ParsedAd[];
  }

  function adDateKey(ad: ParsedAd): string {
    return ((ad.adFirstSeenDate || ad.startDate || '') as string).toString();
  }

  function applyFiltersToAds(input: ParsedAd[], f: FilterState, availableBrands: string[]): ParsedAd[] {
    const mosaicTarget = f.mosaicBrandCategory && f.mosaicBrandCategory !== 'All' ? norm(f.mosaicBrandCategory) : '';
    const selectedBrands = f.brands.length ? f.brands : availableBrands;
    const selectedThemes = f.messageThemes;
    const selectedCreativeTypes = f.adTypes;
    const selectedAdTypes = f.adTypeFilter;
    const from = f.dateFrom;
    const to = f.dateTo;

    return input.filter((ad) => {
      if (mosaicTarget && norm(ad.mosaicBrandCategory) !== mosaicTarget) return false;

      if (selectedBrands.length && !selectedBrands.includes(ad.brandName)) return false;
      if (selectedCreativeTypes.length && !selectedCreativeTypes.includes(ad.adCreativeType)) return false;
      if (selectedAdTypes.length && (!ad.adType || !selectedAdTypes.includes(ad.adType))) return false;

      const theme = (ad.messageTheme || '').toString().trim() || 'Unknown';
      if (selectedThemes.length && !selectedThemes.includes(theme)) return false;

      const d = adDateKey(ad);
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;

      return true;
    });
  }

  function computeBrandSummaries(list: ParsedAd[]): BrandSummary[] {
    const byBrand = new Map<string, ParsedAd[]>();
    for (const ad of list) {
      const b = ad.brandName || 'Unknown';
      if (!byBrand.has(b)) byBrand.set(b, []);
      byBrand.get(b)!.push(ad);
    }

    const out: BrandSummary[] = [];
    for (const [brandName, adsForBrand] of byBrand.entries()) {
      const totalAds = adsForBrand.length;
      const byCreativeType: Record<string, number> = {};
      const byMessageTheme: Record<string, number> = {};
      const byCreativeFormat: Record<string, number> = {};
      const byAdType: Record<string, number> = {};
      const byHookType: Record<string, number> = {};

      let totalDays = 0;
      let longestRunningAd: ParsedAd | null = null;

      for (const ad of adsForBrand) {
        totalDays += ad.daysLive || 0;

        const ct = ad.adCreativeType || 'Static';
        byCreativeType[ct] = (byCreativeType[ct] || 0) + 1;

        const mt = (ad.messageTheme || '').toString().trim() || 'Unknown';
        byMessageTheme[mt] = (byMessageTheme[mt] || 0) + 1;

        const cf = (ad.creativeFormat || ad.adFormat || '').toString().trim() || 'Unknown';
        byCreativeFormat[cf] = (byCreativeFormat[cf] || 0) + 1;

        const at = (ad.adType || '').toString().trim() || 'Unknown';
        byAdType[at] = (byAdType[at] || 0) + 1;

        const ht = (ad.hookType || '').toString().trim() || 'Unknown';
        byHookType[ht] = (byHookType[ht] || 0) + 1;

        if (!longestRunningAd || (ad.daysLive || 0) > (longestRunningAd.daysLive || 0)) {
          longestRunningAd = ad;
        }
      }

      out.push({
        brandName,
        totalAds,
        byCreativeType,
        byMessageTheme,
        byCreativeFormat,
        byAdType,
        byHookType,
        avgDaysLive: totalAds ? Math.round(totalDays / totalAds) : 0,
        longestRunningAd,
      });
    }

    return out.sort((a, b) => b.totalAds - a.totalAds || a.brandName.localeCompare(b.brandName));
  }

  function computeLongevityItems(list: ParsedAd[], top = 20): LongevityAd[] {
    const sorted = [...list].sort((a, b) => (b.daysLive || 0) - (a.daysLive || 0));
    return sorted.slice(0, top).map((ad, idx) => ({ ad, daysLive: ad.daysLive || 0, rank: idx + 1 }));
  }

  function percentileRanks(values: number[]): number[] {
    if (!values.length) return [];
    const sorted = [...values].sort((a, b) => a - b);
    return values.map((v) => {
      // percentile rank: % of values <= v
      let lo = 0;
      let hi = sorted.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (sorted[mid] < v) lo = mid + 1;
        else hi = mid;
      }
      const firstIdx = lo;
      // find last index of v
      lo = firstIdx;
      hi = sorted.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (sorted[mid] > v) hi = mid - 1;
        else lo = mid;
      }
      const lastIdx = lo;
      const pct = ((lastIdx + 1) / sorted.length) * 100;
      return Math.round(pct);
    });
  }

  function computeCreativeStrengthResult(list: ParsedAd[]): CreativeStrengthResult {
    if (!list.length) return { items: [], avgByBrand: [], avgByFormat: [], insights: [] };

    const days = list.map((a) => a.daysLive || 0);
    const dayPct = percentileRanks(days);

    const rawScores = list.map((ad, idx) => {
      const longevity = dayPct[idx] ?? 0;
      const activeBonus = ad.isCurrentlyActive ? 10 : 0;
      const formatBonus = ad.adCreativeType === 'Video' ? 6 : ad.adCreativeType === 'Carousel' ? 3 : 0;
      const stage = (ad.funnelStage || '').toString().trim().toLowerCase();
      const funnelBonus = stage === 'purchase' || stage === 'conversion' ? 6 : stage ? 2 : 0;
      const score = Math.max(0, Math.min(100, Math.round(longevity * 0.75 + activeBonus + formatBonus + funnelBonus)));
      return score;
    });

    const scorePct = percentileRanks(rawScores);
    const items = list.map((ad, idx) => ({
      ad,
      creativeStrengthScore: rawScores[idx] ?? 0,
      creativeStrengthPercentile: scorePct[idx] ?? 0,
    }));

    const avgByBrandMap = new Map<string, { total: number; count: number }>();
    const avgByFormatMap = new Map<string, { total: number; count: number }>();
    for (const it of items) {
      const b = it.ad.brandName || 'Unknown';
      const fmt = it.ad.adCreativeType || 'Static';
      avgByBrandMap.set(b, {
        total: (avgByBrandMap.get(b)?.total || 0) + it.creativeStrengthScore,
        count: (avgByBrandMap.get(b)?.count || 0) + 1,
      });
      avgByFormatMap.set(fmt, {
        total: (avgByFormatMap.get(fmt)?.total || 0) + it.creativeStrengthScore,
        count: (avgByFormatMap.get(fmt)?.count || 0) + 1,
      });
    }

    const avgByBrand = Array.from(avgByBrandMap.entries())
      .map(([brandName, v]) => ({ brandName, avgScore: Math.round(v.total / v.count) }))
      .sort((a, b) => b.avgScore - a.avgScore || a.brandName.localeCompare(b.brandName));

    const avgByFormat = Array.from(avgByFormatMap.entries())
      .map(([format, v]) => ({ format, avgScore: Math.round(v.total / v.count) }))
      .sort((a, b) => b.avgScore - a.avgScore || a.format.localeCompare(b.format));

    const top = avgByBrand[0];
    const fmtTop = avgByFormat[0];
    const insights = [
      top ? `Strongest brand by creative strength: ${top.brandName} (avg ${top.avgScore}).` : '',
      fmtTop ? `Strongest format by creative strength: ${fmtTop.format} (avg ${fmtTop.avgScore}).` : '',
    ].filter(Boolean);

    return { items, avgByBrand, avgByFormat, insights };
  }

  function computeAggressionResult(list: ParsedAd[]): CompetitorAggressionResult {
    if (!list.length) return { brands: [], insights: [] };

    const byBrand = new Map<string, ParsedAd[]>();
    for (const ad of list) {
      const b = ad.brandName || 'Unknown';
      if (!byBrand.has(b)) byBrand.set(b, []);
      byBrand.get(b)!.push(ad);
    }

    const monthKey = (d: string): string => (d && d.length >= 7 ? d.slice(0, 7) : '');

    const rows = Array.from(byBrand.entries()).map(([brandName, adsForBrand]) => {
      const totalAds = adsForBrand.length;
      const avgDaysLive = totalAds
        ? Math.round(adsForBrand.reduce((a, x) => a + (x.daysLive || 0), 0) / totalAds)
        : 0;
      const videoCount = adsForBrand.filter((a) => a.adCreativeType === 'Video').length;
      const pctVideo = totalAds ? Math.round((videoCount / totalAds) * 100) : 0;

      const months = new Set<string>();
      for (const ad of adsForBrand) {
        const mk = monthKey(adDateKey(ad));
        if (mk) months.add(mk);
      }
      const activeMonths = months.size || 1;
      const adsPerMonth = Math.round((totalAds / activeMonths) * 10) / 10;

      return { brandName, totalAds, avgDaysLive, pctVideo, adsPerMonth };
    });

    const maxTotal = Math.max(1, ...rows.map((r) => r.totalAds));
    const maxVelocity = Math.max(1, ...rows.map((r) => r.adsPerMonth));
    const maxVideo = 100;
    const maxChurn = Math.max(1, ...rows.map((r) => (r.avgDaysLive ? 1 / r.avgDaysLive : 0)));

    const withScore = rows.map((r) => {
      const volume = r.totalAds / maxTotal;
      const velocity = r.adsPerMonth / maxVelocity;
      const video = r.pctVideo / maxVideo;
      const churn = (r.avgDaysLive ? 1 / r.avgDaysLive : 0) / maxChurn;
      const aggressionScore = Math.max(0, Math.min(100, Math.round(volume * 35 + velocity * 35 + video * 20 + churn * 10)));
      return { ...r, aggressionScore };
    });

    const sorted = [...withScore].sort((a, b) => b.aggressionScore - a.aggressionScore);
    const n = sorted.length;
    const tiered = sorted.map((r, idx) => {
      const p = (idx + 1) / n;
      const tier =
        p <= 0.25 ? 'Top 25%' : p >= 0.75 ? 'Bottom 25%' : p <= 0.45 ? 'High' : p <= 0.65 ? 'Medium' : 'Low';
      return { ...r, tier };
    });

    const insights = tiered.length
      ? [
          `Most aggressive: ${tiered[0].brandName} (score ${tiered[0].aggressionScore}).`,
          `Least aggressive: ${tiered[tiered.length - 1].brandName} (score ${tiered[tiered.length - 1].aggressionScore}).`,
        ]
      : [];

    return { brands: tiered, insights };
  }

  function computeEmotionFormatMatrix(list: ParsedAd[]): EmotionFormatMatrixResult {
    if (!list.length) return { cells: [], insights: [] };

    const key = (emo: string, fmt: string) => `${emo}||${fmt}`;
    const normLabel = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

    const map = new Map<
      string,
      { emotionalTrigger: string; adFormat: string; totalDays: number; count: number; active: number }
    >();

    for (const ad of list) {
      const emo = normLabel(ad.emotionalTrigger) || 'Unknown';
      const fmt = normLabel(ad.adFormat) || normLabel(ad.adCreativeType) || 'Unknown';
      const k = key(emo, fmt);
      if (!map.has(k)) map.set(k, { emotionalTrigger: emo, adFormat: fmt, totalDays: 0, count: 0, active: 0 });
      const rec = map.get(k)!;
      rec.count += 1;
      rec.totalDays += ad.daysLive || 0;
      if (ad.isCurrentlyActive) rec.active += 1;
    }

    const allCells = Array.from(map.values())
      .filter((c) => c.count >= 5)
      .map((c) => {
        const avgDaysLive = c.count ? Math.round((c.totalDays / c.count) * 10) / 10 : 0;
        const pctActive = c.count ? Math.round((c.active / c.count) * 100) : 0;
        return { ...c, avgDaysLive, pctActive };
      });

    const overallAvg = allCells.length ? allCells.reduce((a, c) => a + c.avgDaysLive, 0) / allCells.length : 0;
    const totalCount = allCells.reduce((a, c) => a + c.count, 0) || 1;

    const cells = allCells
      .map((c) => {
        const share = c.count / totalCount;
        return {
          emotionalTrigger: c.emotionalTrigger,
          adFormat: c.adFormat,
          avgDaysLive: c.avgDaysLive,
          count: c.count,
          pctActive: c.pctActive,
          flagUnderusedHighLongevity: share < 0.1 && overallAvg > 0 && c.avgDaysLive / overallAvg >= 1.2,
          flagOverusedLowLongevity: share > 0.2 && overallAvg > 0 && c.avgDaysLive / overallAvg <= 0.8,
        };
      })
      .sort((a, b) => b.avgDaysLive - a.avgDaysLive || b.count - a.count);

    const bestUnderused = cells.filter((c) => c.flagUnderusedHighLongevity).sort((a, b) => b.avgDaysLive - a.avgDaysLive)[0];
    const insights = bestUnderused
      ? [`Underused winner: ${bestUnderused.emotionalTrigger} × ${bestUnderused.adFormat} (avg ${bestUnderused.avgDaysLive} days).`]
      : [];

    return { cells, insights };
  }

  function computePainOfferAlignmentResult(list: ParsedAd[]): PainOfferAlignmentResult {
    if (!list.length) {
      return { byBrand: [], topCombos: [], topBrands: [], bottomBrands: [], insights: [] };
    }

    const normText = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
    const normKey = (v: unknown) => normText(v).toLowerCase();

    const byBrand = new Map<string, { aligned: number; withPain: number }>();
    const painLabel: Record<string, string> = {};
    const offerLabel: Record<string, string> = {};
    const comboCounts: Record<string, number> = {};

    for (const ad of list) {
      const brand = ad.brandName || 'Unknown';
      if (!byBrand.has(brand)) byBrand.set(brand, { aligned: 0, withPain: 0 });
      const rec = byBrand.get(brand)!;

      const painRaw = normText(ad.primaryPainPoint);
      const offerRaw = normText(ad.offerType);
      const pain = normKey(painRaw);
      const offer = normKey(offerRaw);

      if (pain) {
        rec.withPain += 1;
        if (offer) rec.aligned += 1;
      }

      if (pain) painLabel[pain] = painLabel[pain] || painRaw;
      if (offer) offerLabel[offer] = offerLabel[offer] || offerRaw;
      if (pain && offer) {
        const k = `${pain}||${offer}`;
        comboCounts[k] = (comboCounts[k] || 0) + 1;
      }
    }

    const byBrandRows = Array.from(byBrand.entries()).map(([brandName, v]) => {
      const alignmentPct = v.withPain ? Math.round((v.aligned / v.withPain) * 1000) / 10 : 0;
      return { brandName, alignedCount: v.aligned, totalWithPainPoint: v.withPain, alignmentPct };
    });

    const topCombos = Object.entries(comboCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, count]) => {
        const [pain, offer] = k.split('||');
        return { pain: painLabel[pain] || pain, offer: offerLabel[offer] || offer, count };
      });

    const sorted = [...byBrandRows].sort((a, b) => b.alignmentPct - a.alignmentPct);
    const topBrands = sorted.slice(0, 5);
    const bottomBrands = [...sorted].reverse().slice(0, 5);

    const insights =
      byBrandRows.length > 0
        ? [
            `Best alignment: ${topBrands[0]?.brandName ?? 'N/A'} (${topBrands[0]?.alignmentPct ?? 0}%).`,
            `Worst alignment: ${bottomBrands[0]?.brandName ?? 'N/A'} (${bottomBrands[0]?.alignmentPct ?? 0}%).`,
          ]
        : [];

    return { byBrand: byBrandRows, topCombos, topBrands, bottomBrands, insights };
  }

  const loadBrands = useCallback(
    async (mosaicBrandCategory: FilterState['mosaicBrandCategory']) => {
      // If we already have a dataset locally (API bootstrap),
      // derive brands locally so the UI doesn't depend on backend store state.
      if (datasetAds.length) {
        setBrands(extractBrands(datasetAds, mosaicBrandCategory));
        return;
      }
      try {
        const res = await getBrands(mosaicBrandCategory);
        setBrands(res.brands);
      } catch {
        setBrands([]);
      }
    },
    [datasetAds]
  );

  const availableMessageThemes = extractMessageThemes(datasetAds, {
    mosaicBrandCategory: filters.mosaicBrandCategory,
    filters,
  });

  useEffect(() => {
    // Keep selected theme stable/valid when Mosaic brand (or other option constraints) change.
    if (!filters.messageThemes.length) return;
    const allowed = new Set(availableMessageThemes);
    const next = filters.messageThemes.filter((t) => allowed.has(t));
    if (next.length === filters.messageThemes.length) return;
    setFilters((f) => ({ ...f, messageThemes: next }));
  }, [filters.mosaicBrandCategory, availableMessageThemes.join('|')]);

  const currentFilters: DashboardFilters = {
    brands: (filters.brands.length ? filters.brands : brands) || undefined,
    adTypes: filters.adTypes.length ? filters.adTypes : undefined,
    adType: filters.adTypeFilter.length ? filters.adTypeFilter : undefined,
    messageThemes: filters.messageThemes.length ? filters.messageThemes : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    mosaicBrandCategory:
      filters.mosaicBrandCategory && filters.mosaicBrandCategory !== 'All'
        ? filters.mosaicBrandCategory
        : undefined,
  };

  const loadDashboard = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // If we have a local dataset snapshot (from API bootstrap or CSV refresh),
      // derive everything client-side so charts render even when backend store is empty.
      if (datasetAds.length) {
        const derivedAvailableBrands = extractBrands(datasetAds, filters.mosaicBrandCategory);
        const filtered = applyFiltersToAds(datasetAds, filters, derivedAvailableBrands);

        devLog('[dashboard] local derive', {
          datasetAds: datasetAds.length,
          filteredAds: filtered.length,
          mosaic: filters.mosaicBrandCategory,
          selectedBrands: filters.brands.length,
          selectedThemes: filters.messageThemes.length,
        });

        setBrands(derivedAvailableBrands);
        setAds(filtered);
        setSummaries(computeBrandSummaries(filtered));
        setLongevity(computeLongevityItems(filtered, 20));
        setGaps([]); // gaps are computed directly in components from ads; backend gaps are optional
        setCreativeStrength(computeCreativeStrengthResult(filtered));
        setAggression(computeAggressionResult(filtered));
        setEmotionFormat(computeEmotionFormatMatrix(filtered));
        setPainOfferAlignment(computePainOfferAlignmentResult(filtered));
        return;
      }

      // Fallback: backend store-driven flow (CSV upload pipeline)
      const adsRes = await getAds(currentFilters);
      setAds(adsRes.ads);

      // Derive client-side insights even for backend flow to keep behavior consistent.
      setSummaries(computeBrandSummaries(adsRes.ads));
      setLongevity(computeLongevityItems(adsRes.ads, 20));
      setGaps([]);
      setCreativeStrength(computeCreativeStrengthResult(adsRes.ads));
      setAggression(computeAggressionResult(adsRes.ads));
      setEmotionFormat(computeEmotionFormatMatrix(adsRes.ads));
      setPainOfferAlignment(computePainOfferAlignmentResult(adsRes.ads));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
      setSummaries([]);
      setLongevity([]);
      setGaps([]);
      setCreativeStrength(null);
      setAggression(null);
      setEmotionFormat(null);
      setPainOfferAlignment(null);
      setAds((prev) => prev);
    } finally {
      setLoading(false);
    }
  }, [datasetAds, filters, JSON.stringify(currentFilters), devLog]);

  const loadAI = useCallback(
    async (opts?: { skipCache?: boolean }) => {
      // Trigger AI insights if we have any ads at all, regardless of brand selection.
      if (datasetAds.length === 0 && ads.length === 0) return;
      
      setAiLoading(true);
      try {
        const payload = await getAIInsights(
          {
            ...currentFilters,
            dateFrom:
              currentFilters.dateFrom ||
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            dateTo: currentFilters.dateTo || new Date().toISOString().slice(0, 10),
          },
          opts?.skipCache
        );
        setAiPayload(payload);
      } catch {
        setAiPayload(null);
      } finally {
        setAiLoading(false);
      }
    },
    [brands.length, filters.brands.length, filters.mosaicBrandCategory, JSON.stringify(currentFilters)]
  );

  useEffect(() => {
    loadBrands(filters.mosaicBrandCategory);
  }, [filters.mosaicBrandCategory, loadBrands]);

  const META_ADS_API = '/api/meta-ads';

  useEffect(() => {
    let cancelled = false;

    async function bootstrapFromApi() {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch(META_ADS_API);
        if (!res.ok) throw new Error(`Failed to load ad data (${res.status})`);
        const json: unknown = await res.json();
        const apiAds = parseMetaAdsResponse(json);
        if (cancelled) return;

        devLog('[bootstrapFromApi] loaded', { ads: apiAds.length, shape: Array.isArray(json) ? 'array' : 'object' });

        setDatasetAds(apiAds);
        // Do not set `ads` directly here; `loadDashboard()` will apply filters and derive all chart data.

        if (apiAds.length > 0) {
          const derivedBrands = extractBrands(apiAds, defaultFilters.mosaicBrandCategory);
          setBrands(derivedBrands);
          // Keep UI unchanged: don't auto-select brands; let dashboard render with "all brands" by default.
        }

        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setDatasetAds([]);
        setAds([]);
        setError(e instanceof Error ? e.message : 'Failed to load ad data from server. You can upload a CSV instead.');
        setLoading(false);
      }
    }

    bootstrapFromApi();
    return () => {
      cancelled = true;
    };
    // Intentionally run once: CSV upload should override later via existing flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Run whenever filters change; `loadDashboard` decides whether to use local dataset or backend store.
    if (datasetAds.length > 0 || brands.length > 0 || filters.brands.length > 0) {
      void loadDashboard();
    }
  }, [datasetAds.length, brands.length, filters.brands.length, loadDashboard]);

  useEffect(() => {
    if (ads.length > 0) {
      loadAI();
    }
  }, [ads.length, loadAI]);

  const handleUploadSuccess = useCallback((uploadedBrands: string[]) => {
    setUploadOpen(false);
    setBrands(uploadedBrands);
    setFilters((f) => ({ ...f, brands: uploadedBrands.slice(0, 10) }));
    // Refresh dataset snapshot so theme dropdown adapts after CSV upload.
    void (async () => {
      try {
        const res = await getAds({} as any);
        setDatasetAds(res.ads);
      } catch {
        setDatasetAds([]);
      }
    })();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    await loadAI({ skipCache: true });
    setRefreshing(false);
  }, [loadDashboard, loadAI]);

  const totalAds = summaries.reduce((a, s) => a + s.totalAds, 0);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          'linear-gradient(135deg, #dff5ec 0%, #b8ead7 35%, #8fdcc4 70%, #6bcfb3 100%)',
      }}
    >
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="w-full px-8 xl:px-16 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-xs font-semibold text-white shadow-sm">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-semibold text-slate-900">
                  Mosaic AdIntel
                </span>
                <span className="hidden text-xs text-slate-500 sm:inline">
                  Competitor ad intelligence dashboard
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:shadow-md"
              >
                {refreshing ? 'Refreshing…' : 'Refresh dashboard'}
              </Button>
              <Button
                onClick={() => setUploadOpen(true)}
                className="rounded-xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-8 xl:px-16 py-8">
        <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onSuccess={handleUploadSuccess} />

        {(brands.length > 0 || datasetAds.length > 0) && (
          <FiltersBar
            availableBrands={brands}
            availableMessageThemes={availableMessageThemes}
            filters={filters}
            onFiltersChange={setFilters}
            className="mb-6"
          />
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}

        {datasetAds.length === 0 && ads.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 py-16 text-center"
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 font-display text-lg font-semibold">No data yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Upload a CSV of competitor Meta ads to see dashboards and AI insights. Include columns like Brand Name,
              Ad Creative Type, Ad Copy, Headline, Start/End Date.
            </p>
            <Button className="mt-6" onClick={() => setUploadOpen(true)}>
              Upload CSV
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {(datasetAds.length > 0 || brands.length > 0) && (
              <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : ads.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-muted-foreground/25 bg-muted/20 p-6 text-center"
                >
                  <h2 className="font-display text-lg font-semibold">No ads found</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try widening filters (Mosaic brand, message theme, date range) or clearing selections.
                  </p>
                </motion.div>
              ) : (
                <>
                  <OverviewKPIs summaries={summaries} totalAds={totalAds} />
                  <StrategicSnapshot creativeStrength={creativeStrength} aggression={aggression} ads={ads} />
                  <div className="grid gap-5 lg:grid-cols-2 items-stretch">
                    <AdFormatDistribution summaries={summaries} />
                    <MessageThemeTrends
                      summaries={summaries}
                      mosaicBrandCategory={filters.mosaicBrandCategory}
                      viewMode={themeViewMode}
                      onViewModeChange={setThemeViewMode}
                    />
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2 items-stretch">
                    <LongestRunningAds items={longevity} allAds={ads} />
                    <GapOpportunities gaps={gaps} ads={ads} />
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2 items-stretch">
                    <CreativeSaturation
                      ads={ads}
                      mosaicBrandCategory={filters.mosaicBrandCategory}
                      viewMode={themeViewMode}
                    />
                    <FunnelStageDistribution ads={ads} />
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2 items-stretch">
                    <PainPointOfferChart ads={ads} />
                    <div className="hidden lg:block" />
                  </div>
                  <div className="grid gap-5 lg:grid-cols-2 items-stretch">
                    <CreativeStrengthIntelligence data={creativeStrength} />
                    <CompetitiveAggressionIndex data={aggression} />
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <EmotionIntelligenceMatrix data={emotionFormat} />
                    <PainOfferAlignmentIntelligence data={painOfferAlignment} />
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <AIWeeklyBrief
                      payload={aiPayload}
                      loading={aiLoading}
                      summaries={summaries}
                      ads={ads}
                      aggression={aggression}
                      alignment={painOfferAlignment}
                      onRefresh={() => loadAI({ skipCache: true })}
                    />
                    <ActionRecommendations
                      ads={ads}
                      summaries={summaries}
                      longevity={longevity}
                      gaps={gaps}
                      mosaicBrandCategory={filters.mosaicBrandCategory}
                      loading={loading || aiLoading}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
