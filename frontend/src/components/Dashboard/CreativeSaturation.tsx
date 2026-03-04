import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { ParsedAd } from '@/types';
import { computeClusterSaturation, getBrandColorPalette } from '@/lib/analytics';

interface CreativeSaturationProps {
  ads: ParsedAd[];
  mosaicBrandCategory: string;
  viewMode: 'raw' | 'cluster';
}

type SaturationLabel = 'Saturated' | 'Balanced' | 'White Space' | 'Neutral';

function labelSaturation(sharePct: number): SaturationLabel {
  const share = sharePct / 100;
  if (share > 0.35) return 'Saturated';
  if (share >= 0.15) return 'Balanced';
  if (share < 0.1) return 'White Space';
  return 'Neutral';
}

export function CreativeSaturation({ ads, mosaicBrandCategory }: CreativeSaturationProps) {
  const raw = computeClusterSaturation(ads);
  const base = raw.map((t) => ({
    name: t.theme,
    share: Number((t.share * 100).toFixed(1)),
  }));

  const enriched = base.map((d) => ({
    ...d,
    label: labelSaturation(d.share),
  }));

  const palette = getBrandColorPalette(mosaicBrandCategory);

  const whitespace = enriched
    .filter((d) => d.label === 'White Space' && d.share > 0)
    .sort((a, b) => a.share - b.share)[0];
  const saturated = enriched
    .filter((d) => d.label === 'Saturated')
    .sort((a, b) => b.share - a.share)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-800">
            Creative saturation by strategic theme
          </CardTitle>
          <p className="text-sm text-slate-500">
            🔴 &gt;35% Saturated · 🟡 15–35% Balanced · 🟢 &lt;10% White Space.
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          {enriched.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ads in the current selection. Adjust filters or upload data to see saturation.
            </p>
          ) : (
            <>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enriched} layout="vertical" margin={{ left: 140 }}>
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: number, _name, props: any) => [
                        `${(value as number).toFixed(1)}% · ${props.payload.label}`,
                        'Share of ads',
                      ]}
                    />
                    <Bar
                      dataKey="share"
                      name="Share of ads"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={false}
                    >
                      {enriched.map((_entry, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Cell key={idx} fill={palette[idx % palette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs sm:text-sm space-y-1">
                {whitespace && (
                  <p className="text-emerald-700 dark:text-emerald-400">
                    🟢 {whitespace.name} ({whitespace.share.toFixed(1)}%) is a white space opportunity.
                  </p>
                )}
                {saturated && (
                  <p className="text-red-700 dark:text-red-400">
                    🔴 {saturated.name} ({saturated.share.toFixed(1)}%) is saturated. New tests should de-risk in adjacent themes.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

