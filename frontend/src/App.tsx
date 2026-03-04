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
  getSummaries,
  getLongevity,
  getGaps,
  getAIInsights,
  getAds,
  getCreativeStrength,
  getAggression,
  getEmotionFormat,
  getPainOfferAlignment,
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
      const [sumRes, longRes, gapRes, adsRes, strengthRes, aggressionRes, emotionRes, alignmentRes] =
        await Promise.all([
          getSummaries(currentFilters),
          getLongevity(currentFilters, 20),
          getGaps(currentFilters),
          getAds(currentFilters),
          getCreativeStrength(currentFilters),
          getAggression(currentFilters),
          getEmotionFormat(currentFilters),
          getPainOfferAlignment(currentFilters),
        ]);
      setSummaries(sumRes.summaries);
      setLongevity(longRes.items);
      setGaps(gapRes.gaps);
      setAds(adsRes.ads);
      setCreativeStrength(strengthRes);
      setAggression(aggressionRes);
      setEmotionFormat(emotionRes);
      setPainOfferAlignment(alignmentRes);
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
  }, [JSON.stringify(currentFilters)]);

  const loadAI = useCallback(
    async (opts?: { skipCache?: boolean }) => {
      if ((brands.length === 0 && filters.brands.length === 0) && !filters.mosaicBrandCategory) return;
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

  const META_ADS_API = 'https://mosaic-adintel-dashboard.onrender.com/api/meta-ads';

  useEffect(() => {
    let cancelled = false;

    async function bootstrapFromApi() {
      setError(null);
      try {
        const res = await fetch(META_ADS_API);
        if (!res.ok) throw new Error(`Failed to load ad data (${res.status})`);
        const json: unknown = await res.json();
        const data = Array.isArray(json) ? json : (json as { data?: unknown })?.data;
        if (!Array.isArray(data)) throw new Error('Invalid response shape');

        const apiAds = data as ParsedAd[];
        if (cancelled) return;

        setDatasetAds(apiAds);
        setAds(apiAds);

        if (apiAds.length > 0) {
          const derivedBrands = extractBrands(apiAds, filters.mosaicBrandCategory);
          setBrands(derivedBrands);
          setFilters((f) => (f.brands.length ? f : { ...f, brands: derivedBrands.slice(0, 10) }));
        } else {
          setLoading(false);
        }
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
    if (brands.length > 0 || filters.brands.length > 0) loadDashboard();
    else setLoading(false);
  }, [brands.length, filters.brands.length, loadDashboard]);

  useEffect(() => {
    if (summaries.length > 0) loadAI();
  }, [summaries.length, loadAI]);

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
