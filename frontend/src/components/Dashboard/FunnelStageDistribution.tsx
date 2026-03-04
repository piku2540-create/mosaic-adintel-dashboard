import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { ParsedAd } from '@/types';
import { computeAidaFunnel, type AIDAStage } from '@/lib/analytics';

interface FunnelStageDistributionProps {
  ads: ParsedAd[];
}

const AIDA_COLORS: Record<AIDAStage, string> = {
  Awareness: '#A7F3D0',
  Interest: '#6EE7B7',
  Desire: '#FDE68A',
  Action: '#34D399',
};

export function FunnelStageDistribution({ ads }: FunnelStageDistributionProps) {
  if (ads.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800">AIDA funnel coverage</CardTitle>
            <p className="text-sm text-slate-500">
              No ads in the current selection. Adjust filters or date range to see funnel diagnostics.
            </p>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  const insights = computeAidaFunnel(ads);
  const stages = insights.stages.map((s) => ({
    stage: s.stage,
    count: s.count,
    sharePct: Number((s.share * 100).toFixed(1)),
  }));

  const imbalance = (() => {
    const ideal = 0.25;
    const deviation = insights.stages.reduce((acc, s) => acc + Math.abs((s.share || 0) - ideal), 0);
    const normalized = Math.max(0, Math.min(1, deviation / 1.5));
    const label = normalized <= 0.3 ? 'Balanced' : normalized <= 0.6 ? 'Moderate Bias' : 'High Imbalance';
    return { score: normalized, label };
  })();

  const awareness = insights.stages.find((s) => s.stage === 'Awareness')?.share ?? 0;
  const action = insights.stages.find((s) => s.stage === 'Action')?.share ?? 0;
  const interest = insights.stages.find((s) => s.stage === 'Interest')?.share ?? 0;

  const weakTopFunnel = awareness > 0 && awareness < 0.15;
  const weakBottomFunnel = action > 0 && action < 0.15;

  const compressionRatio = interest > 0 ? action / interest : null;
  const compressionLabel =
    compressionRatio === null
      ? 'Unknown'
      : compressionRatio < 0.5
      ? 'Poor'
      : compressionRatio <= 0.8
      ? 'Balanced'
      : 'Strong';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-800">AIDA funnel coverage</CardTitle>
          <p className="text-sm text-slate-500">
            Awareness · Interest · Desire · Action distribution for current selection.
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="mb-3 rounded-md bg-muted/60 p-3 text-xs sm:text-sm">
            <div className="font-medium text-foreground">Funnel Imbalance Score</div>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{imbalance.score.toFixed(2)}</span> ·{' '}
              <span className="font-semibold text-foreground">{imbalance.label}</span>
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stages} margin={{ left: 8, right: 16 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'count') {
                      return [`${value} ads (${props.payload.sharePct}%)`, 'Ads'];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="count" name="Ads" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {stages.map((s) => (
                    <Cell key={s.stage} fill={AIDA_COLORS[s.stage as AIDAStage]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {insights.overReliance && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
                Over-reliance on {insights.overReliance.stage} creatives (
                {(insights.overReliance.share * 100).toFixed(0)}% of ads).
              </p>
            )}
            {weakTopFunnel && (
              <p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
                Awareness &lt; 15% — top funnel is under-weighted.
              </p>
            )}
            {weakBottomFunnel && (
              <p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
                Action &lt; 15% — bottom funnel conversion layering is weak.
              </p>
            )}
            <div className="mt-2 rounded-md bg-muted/60 p-3 text-xs sm:text-sm">
              <div className="font-medium text-foreground">Compression index (Action ÷ Interest)</div>
              {compressionRatio === null ? (
                <p className="text-muted-foreground">
                  Not enough Interest/Action data to compute compression.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Score:{' '}
                  <span className="font-semibold text-foreground">
                    {compressionRatio.toFixed(2)}
                  </span>{' '}
                  · <span className="font-semibold text-foreground">{compressionLabel}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

