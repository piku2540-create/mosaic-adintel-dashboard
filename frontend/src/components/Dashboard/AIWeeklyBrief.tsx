import { motion } from 'framer-motion';
import { Sparkles, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type {
  AIInsightsPayload,
  AIInsightItem,
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

const typeLabels: Record<AIInsightItem['type'], string> = {
  trend: 'Trend',
  comparison: 'Comparison',
  gap: 'Gap',
  longevity: 'Longevity',
  summary: 'Summary',
};

export function AIWeeklyBrief({
  payload,
  loading,
  onRefresh,
  summaries,
  ads,
  aggression,
  alignment,
}: AIWeeklyBriefProps) {

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

    // Pad to 5–7 bullets with high-signal non-brand-specific lines.
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

  const visibleInsights = payload?.insights
    ? payload.insights.filter((i) => !i.brand || selectedSet.has(i.brand))
    : [];

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
              </div>
              <div>
                <h4 className="mb-2 font-medium">Detailed insights</h4>
                <ul className="space-y-3">
                  {visibleInsights.map((insight, i) => (
                    <li key={i} className="rounded-md border bg-muted/20 p-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-primary">
                        {typeLabels[insight.type]}
                        {insight.brand ? ` · ${insight.brand}` : ''}
                      </span>
                      <p className="mt-1 font-medium text-foreground">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.body}</p>
                      {insight.evidence?.length ? (
                        <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                          {insight.evidence.map((e, j) => (
                            <li key={j}>{e}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
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
