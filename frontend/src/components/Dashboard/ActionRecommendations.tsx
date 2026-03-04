import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { ParsedAd, BrandSummary, LongevityAd, GapOpportunity } from '@/types';
import {
  generateTieredActionRecommendations,
  type RecommendationTier,
  type TieredActionRecommendation,
} from '@/lib/analytics';

interface ActionRecommendationsProps {
  ads: ParsedAd[];
  summaries: BrandSummary[];
  longevity: LongevityAd[];
  gaps: GapOpportunity[];
  mosaicBrandCategory: string;
  loading?: boolean;
}

const TIER_META: Record<
  RecommendationTier,
  { label: string; accent: string; prefix: string }
> = {
  immediate: { label: 'Immediate Scale', accent: 'text-emerald-600 dark:text-emerald-400', prefix: '🟢 ' },
  test_expand: { label: 'Test & Expand', accent: 'text-amber-600 dark:text-amber-400', prefix: '🟡 ' },
  strategic: { label: 'Strategic Fix', accent: 'text-red-600 dark:text-red-400', prefix: '🔴 ' },
};

function groupByTier(recs: TieredActionRecommendation[]): Record<RecommendationTier, TieredActionRecommendation[]> {
  return {
    immediate: recs.filter((r) => r.tier === 'immediate'),
    test_expand: recs.filter((r) => r.tier === 'test_expand'),
    strategic: recs.filter((r) => r.tier === 'strategic'),
  };
}

export function ActionRecommendations({
  ads,
  summaries,
  longevity,
  gaps,
  mosaicBrandCategory,
  loading,
}: ActionRecommendationsProps) {
  const recommendations = generateTieredActionRecommendations({
    ads,
    summaries,
    longevity,
    gaps,
    mosaicBrandCategory,
  });

  const byTier = groupByTier(recommendations);
  const hasAny =
    byTier.immediate.length + byTier.test_expand.length + byTier.strategic.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Target className="h-5 w-5 text-primary" />
            Paid media war room actions
          </CardTitle>
          <p className="text-sm text-slate-500">
            Tiered roadmap across scale, testing, and strategic fixes.
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Crunching recommendations…
            </div>
          ) : !hasAny ? (
            <p className="text-sm text-muted-foreground">
              Not enough data in the current selection to generate recommendations. Broaden filters or date
              range to see guidance.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              {(Object.keys(TIER_META) as RecommendationTier[]).map((tier) =>
                byTier[tier].length === 0 ? null : (
                  <div key={tier}>
                    <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${TIER_META[tier].accent}`}>
                      {TIER_META[tier].prefix}
                      {TIER_META[tier].label}
                    </p>
                    <ul className="space-y-2">
                      {byTier[tier].map((rec) => (
                        <li
                          key={rec.id}
                          className="rounded-md border border-primary/20 bg-accent/10 p-3 text-sm"
                        >
                          <p className="font-medium text-foreground">{rec.title}</p>
                          <p className="mt-1 text-muted-foreground">{rec.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

