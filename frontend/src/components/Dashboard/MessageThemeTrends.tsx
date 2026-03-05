import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { BrandSummary } from '@/types';
import { getBrandColorPalette } from '@/lib/analytics';

interface MessageThemeTrendsProps {
  summaries: BrandSummary[];
  mosaicBrandCategory: string;
  viewMode: 'raw' | 'cluster';
  onViewModeChange: (mode: 'raw' | 'cluster') => void;
}

export function MessageThemeTrends({
  summaries,
  mosaicBrandCategory,
  viewMode,
  onViewModeChange,
}: MessageThemeTrendsProps) {
  const aggregated: Record<string, number> = {};
  for (const s of summaries) {
    for (const [theme, count] of Object.entries(s.byMessageTheme || {})) {
      const key = theme || 'Others';
      aggregated[key] = (aggregated[key] || 0) + count;
    }
  }
  const entries = Object.entries(aggregated)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const top = entries.slice(0, 6);
  const rest = entries.slice(6);
  const othersTotal = rest.reduce((a, [, v]) => a + v, 0);

  const data = [
    ...top.map(([name, value]) => ({ name, value })),
    ...(othersTotal > 0 ? [{ name: 'Others', value: othersTotal }] : []),
  ];

  const palette = getBrandColorPalette(mosaicBrandCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-md border border-emerald-100">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Message Theme Mix
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Aggregated across selected brands
              </p>
            </div>
            <div className="inline-flex items-center gap-0.5 rounded-xl bg-slate-100 p-1 text-xs shadow-inner">
              <button
                type="button"
                onClick={() => onViewModeChange('raw')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'raw'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Raw themes
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('cluster')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'cluster'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Strategic clusters
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, idx) => (
                    <Cell key={entry.name} fill={palette[idx % palette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Ads']} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: 8, lineHeight: '1.4em' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
