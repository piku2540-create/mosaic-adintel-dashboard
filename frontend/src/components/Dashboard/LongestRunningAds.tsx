import { motion } from 'framer-motion';
import { Award, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { LongevityAd, ParsedAd } from '@/types';
import { computeLongevitySummary, clusterMessageTheme } from '@/lib/analytics';

interface LongestRunningAdsProps {
  items: LongevityAd[];
  allAds: ParsedAd[];
}

export function LongestRunningAds({ items, allAds }: LongestRunningAdsProps) {
  const summary = computeLongevitySummary(allAds);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Award className="h-5 w-5 text-primary" />
            Longest-running ads (longevity intelligence)
          </CardTitle>
          <p className="text-sm text-slate-500">Patterns behind creatives that stay live the longest.</p>
        </CardHeader>
        <CardContent className="pt-2">
          {items.length === 0 || allAds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No longevity data for the current selection. Upload data or widen filters.
            </p>
          ) : (
            <>
              <div className="mb-3 rounded-md bg-muted/40 p-3 text-xs sm:text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    Overall avg days live:{' '}
                    <span className="font-semibold">
                      {summary.overallAvg ? summary.overallAvg.toFixed(1) : '—'}
                    </span>
                  </span>
                </div>
                {summary.byFormat.length >= 2 && (
                  <p className="text-muted-foreground">
                    Static ads average {summary.byFormat.find((f) => f.format === 'Static')?.avg.toFixed(1) ?? '—'} days vs
                    Video{' '}
                    {summary.byFormat.find((f) => f.format === 'Video')?.avg.toFixed(1) ?? '—'} days.
                  </p>
                )}
              </div>

              <ul className="space-y-3">
                {items.slice(0, 10).map((l, i) => {
                  const isHighRetention = summary.highRetentionIds.has(l.ad.id);
                  const cluster = clusterMessageTheme(l.ad.messageTheme || '');
                  return (
                    <motion.li
                      key={l.ad.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.03 }}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-foreground">{l.ad.brandName}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{l.ad.adCreativeType}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{cluster}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {l.daysLive} days
                        </span>
                        {isHighRetention && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            High Retention Creative
                          </span>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
