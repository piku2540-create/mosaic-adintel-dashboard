import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  AIInsightsPayload,
  BrandSummary,
  ParsedAd,
  CompetitorAggressionResult,
  PainOfferAlignmentResult,
} from '@/types';
import { normalizeToAida } from '@/lib/analytics';

interface AIWeeklyBriefProps {
  payload: AIInsightsPayload | null;
  loading?: boolean;
  onRefresh?: () => void;
  summaries?: BrandSummary[];
  ads?: ParsedAd[];
  aggression?: CompetitorAggressionResult | null;
  alignment?: PainOfferAlignmentResult | null;
}

export function AIWeeklyBrief({
  payload,
  loading,
  onRefresh,
  summaries,
  ads,
  aggression,
  alignment,
}: AIWeeklyBriefProps) {
  const [showDetails, setShowDetails] = useState(false);

  const perBrandAwareness = (() => {
    const map = new Map<string, { total: number; awareness: number }>();
    if (!ads?.length) return map;
    for (const ad of ads) {
      const b = ad.brandName || 'Unknown';
      if (!map.has(b)) map.set(b, { total: 0, awareness: 0 });
      const rec = map.get(b)!;
      rec.total += 1;
      const stage = normalizeToAida(ad.funnelStage, ad.messageTheme);
      if (stage === 'Awareness') rec.awareness += 1;
    }
    return map;
  })();

  const alignmentByBrand = new Map<string, number>(
    (alignment?.byBrand || []).map((r) => [r.brandName, r.alignmentPct]),
  );
  const aggressionTop25 = new Set<string>(
    (aggression?.brands || []).filter((b) => b.tier === 'Top 25%').map((b) => b.brandName),
  );

  const qualifying = (summaries || []).map((s) => {
    const total = s.totalAds || 0;
    const video = s.byCreativeType?.Video ?? 0;
    const videoPct = total ? (video / total) * 100 : 0;
    const aw = perBrandAwareness.get(s.brandName);
    const awarenessShare = aw && aw.total ? aw.awareness / aw.total : null;
    const alignPct = alignmentByBrand.get(s.brandName);
    const isAggTop = aggressionTop25.has(s.brandName);
    const reasons: string[] = [];
    if (videoPct > 80) reasons.push(`Video-heavy (${Math.round(videoPct)}%)`);
    if (awarenessShare !== null && awarenessShare < 0.1) reasons.push(`Low awareness (${Math.round(awarenessShare * 100)}%)`);
    if (isAggTop) {
      const row = aggression?.brands?.find((b) => b.brandName === s.brandName);
      reasons.push(`Top-25% aggression${row ? ` (${row.aggressionScore})` : ''}`);
    }
    if (alignPct !== undefined && alignPct < 40) reasons.push(`Low alignment (${alignPct}%)`);
    if (s.avgDaysLive < 10) reasons.push(`Low longevity (${s.avgDaysLive}d)`);
    return { brand: s.brandName, reasons };
  });

  const qualifyingBrands = qualifying.filter((q) => q.reasons.length > 0);
  const selectedBrands =
    qualifyingBrands.length > 0
      ? qualifyingBrands
          .sort((a, b) => b.reasons.length - a.reasons.length)
          .slice(0, 5)
          .map((q) => q.brand)
      : (aggression?.brands || []).slice(0, 3).map((b) => b.brandName);

  const selectedSet = new Set<string>(selectedBrands);

  const focusedBullets = (() => {
    const bullets: string[] = [];

    const selectedDetails = qualifyingBrands
      .filter((q) => selectedSet.has(q.brand))
      .map((q) => `${q.brand}: ${q.reasons.join(', ')}.`);

    if (selectedDetails.length > 0) {
      bullets.push(...selectedDetails);
    } else if (selectedBrands.length > 0) {
      for (const b of selectedBrands) {
        const row = aggression?.brands?.find((x) => x.brandName === b);
        bullets.push(
          row
            ? `${b}: Aggression score ${row.aggressionScore} (Top 25%).`
            : `${b}: High aggression.`,
        );
      }
    }

    if (aggression?.brands?.length) {
      const top = aggression.brands[0];
      bullets.push(`Most aggressive: ${top.brandName} (score ${top.aggressionScore}, ${top.totalAds} ads, ${top.avgDaysLive} avg days live).`);
    }

    if (alignment?.byBrand?.length) {
      const totalAligned = alignment.byBrand.reduce((a, r) => a + r.alignedCount, 0);
      const totalWithPain = alignment.byBrand.reduce((a, r) => a + r.totalWithPainPoint, 0);
      const overall = totalWithPain ? Math.round((totalAligned / totalWithPain) * 10) / 10 : 0;
      bullets.push(`Overall pain–offer alignment health: ${overall}%.`);
    }

    const nonEmpty = bullets.filter(Boolean);
    const unique = Array.from(new Set(nonEmpty));
    return unique.slice(0, Math.min(7, Math.max(5, unique.length)));
  })();

  const derivedDetailedInsights = useMemo(() => {
    const items: { title: string; body: string }[] = [];

    if (aggression?.brands?.length) {
      const top = aggression.brands[0];
      items.push({
        title: 'Most aggressive brand in this set',
        body: `${top.brandName} leads on aggression with ${top.totalAds} ads, avg ${top.avgDaysLive} days live, aggression score ${top.aggressionScore}.`,
      });

      const topTier = aggression.brands.filter((b) => b.tier === 'Top 25%');
      if (topTier.length) {
        items.push({
          title: 'Aggression top-25% cluster',
          body: `${topTier.length} brand(s) are in the Top-25% aggression tier (heavier testing and volume vs the rest of the market).`,
        });
      }
    }

    if (alignment?.byBrand?.length) {
      const sorted = [...alignment.byBrand].sort((a, b) => b.alignmentPct - a.alignmentPct);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      if (best) {
        items.push({
          title: 'Best pain–offer alignment',
          body: `${best.brandName} is strongest: ${best.alignmentPct}% of pain-point ads include a clear offer.`,
        });
      }
      if (worst && worst.brandName !== best?.brandName) {
        items.push({
          title: 'Weakest pain–offer alignment',
          body: `${worst.brandName} is weakest: only ${worst.alignmentPct}% of pain-point ads include a clear offer.`,
        });
      }
    }

    if (ads?.length) {
      const total = ads.length;

      const stageCounts = new Map<string, number>();
      for (const ad of ads) {
        const stage = (ad.funnelStage || 'Unknown').trim() || 'Unknown';
        stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
      }
      const stageEntries = Array.from(stageCounts.entries()).sort((a, b) => b[1] - a[1]);
      if (stageEntries.length) {
        const [topStage, topCount] = stageEntries[0];
        const pct = Math.round((topCount / total) * 100);
        items.push({
          title: 'Dominant funnel stage',
          body: `"${topStage}" accounts for ~${pct}% of ads in the current view.`,
        });
      }

      const typeCounts = new Map<string, number>();
      for (const ad of ads) {
        const t = ad.adCreativeType || 'Static';
        typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
      }
      const typeEntries = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);
      if (typeEntries.length) {
        const [topFmt, topCount] = typeEntries[0];
        const pct = Math.round((topCount / total) * 100);
        items.push({
          title: 'Creative format saturation',
          body: `${topFmt} represents ~${pct}% of ads. Treat this as the control format while testing under-represented formats for incremental wins.`,
        });
      }

      const withDays = ads
        .map((ad) => ({ ad, days: ad.daysLive ?? 0 }))
        .filter((x) => x.days > 0)
        .sort((a, b) => b.days - a.days);
      if (withDays.length) {
        const top = withDays[0];
        items.push({
          title: 'Longest-running creative in market',
          body: `${top.ad.brandName} has a creative live for ~${top.days} days (${top.ad.adCreativeType}, ${top.ad.messageTheme || 'Unknown'}). Likely an evergreen angle worth reverse-engineering.`,
        });
      }
    }

    return items;
  }, [aggression, alignment, ads]);

  const actionableInsights = useMemo(() => {
    const recs: string[] = [];

    if (aggression?.brands?.length) {
      const top = aggression.brands[0];
      recs.push(
        `Benchmark your testing velocity against ${top.brandName} (aggression leader). Set a target for ads/month and average days live.`,
      );
    }

    if (alignment?.byBrand?.length) {
      const sorted = [...alignment.byBrand].sort((a, b) => a.alignmentPct - b.alignmentPct);
      const weakest = sorted[0];
      if (weakest) {
        recs.push(
          `Improve pain→offer translation: audit ${weakest.brandName} creatives where a pain point is present but the offer is unclear; rewrite into tighter pain-offer pairs.`,
        );
      }
    }

    if (ads?.length) {
      const total = ads.length;

      const stageCounts = new Map<string, number>();
      for (const ad of ads) {
        const stage = (ad.funnelStage || 'Unknown').trim() || 'Unknown';
        stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
      }
      const underused = Array.from(stageCounts.entries()).filter(
        ([stage, count]) => stage.toLowerCase() !== 'unknown' && count / total < 0.1,
      );
      if (underused.length) {
        recs.push(`Run a small creative test flight aimed at the underused funnel stage "${underused[0][0]}" to close journey gaps.`);
      }

      const typeCounts = new Map<string, number>();
      for (const ad of ads) {
        const t = ad.adCreativeType || 'Static';
        typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
      }
      const typeEntries = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);
      if (typeEntries.length >= 2) {
        const [topFmt, topCount] = typeEntries[0];
        const [secondFmt] = typeEntries[1];
        const pct = Math.round((topCount / total) * 100);
        recs.push(`Keep ${topFmt} as the control (~${pct}% of ads), but structure A/B tests using ${secondFmt} to probe for cheaper or more durable reach.`);
      }

      const withDays = ads
        .map((ad) => ({ ad, days: ad.daysLive ?? 0 }))
        .filter((x) => x.days > 0)
        .sort((a, b) => b.days - a.days);
      if (withDays.length) {
        const top = withDays[0];
        recs.push(`Use the ~${top.days}-day longest-running creative as a reference point for kill/scale decisions on your own ads.`);
      }
    }

    const unique = Array.from(new Set(recs)).filter(Boolean);
    return unique.slice(0, Math.min(5, Math.max(3, unique.length)));
  }, [aggression, alignment, ads]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-lg font-semibold text-slate-800">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI weekly brief
            </span>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                {loading ? 'Generating…' : 'Refresh'}
              </Button>
            )}
          </CardTitle>
          <p className="text-sm text-slate-500">
            {payload ? `Generated ${new Date(payload.generatedAt).toLocaleString()}` : 'Generate insights from your data'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading AI insights…
            </div>
          )}
          {!loading && payload && (
            <>
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  This week in 5–7 bullets
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {(summaries?.length ? focusedBullets : payload.weeklyBrief).slice(0, 7).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>

                {actionableInsights.length > 0 && (
                  <div>
                    <h4 className="mt-4 mb-2 font-medium">Actionable Insights (3–5)</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {actionableInsights.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {derivedDetailedInsights.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowDetails((v) => !v)}
                    className="mb-2 flex w-full items-center justify-between text-left"
                  >
                    <span className="font-medium">Detailed insights</span>
                    <span className="text-xs text-muted-foreground">{showDetails ? 'Hide' : 'Show'}</span>
                  </button>

                  {showDetails && (
                    <ul className="space-y-3">
                      {derivedDetailedInsights.map((insight, i) => (
                        <li key={i} className="rounded-md border bg-muted/20 p-3">
                          <p className="mt-0.5 font-medium text-foreground">{insight.title}</p>
                          <p className="text-sm text-muted-foreground">{insight.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
          {!loading && !payload && (
            <p className="text-sm text-muted-foreground">Generating AI weekly brief...</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
