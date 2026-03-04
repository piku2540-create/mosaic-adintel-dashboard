import { motion } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { CompetitorAggressionResult } from '@/types';

interface CompetitiveAggressionIndexProps {
  data: CompetitorAggressionResult | null;
}

const TIER_COLORS: Record<string, string> = {
  'Top 25%': '#34D399',
  High: '#6EE7B7',
  Medium: '#A7F3D0',
  Low: '#FDE68A',
  'Bottom 25%': '#C7D2FE',
};

export function CompetitiveAggressionIndex({ data }: CompetitiveAggressionIndexProps) {
  if (!data) return null;

  const scatterData = data.brands.map((b) => ({
    name: b.brandName,
    x: b.avgDaysLive,
    y: b.totalAds,
    score: b.aggressionScore,
    tier: b.tier,
  }));

  const median = (values: number[]): number => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
    return sorted[mid];
  };

  const medianX = median(scatterData.map((d) => d.x));
  const medianY = median(scatterData.map((d) => d.y));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 pb-7 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <TrendingUp className="h-5 w-5 text-primary" />
            Competitive Aggression Index
          </CardTitle>
          <p className="text-sm text-slate-500">
            Volume, churn, velocity, and video intensity per brand (0–100). Scatter: Avg Days Live vs Total Ads.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {data.brands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No brands in the current selection. Adjust filters to see aggression scores.
            </p>
          ) : (
            <>
              {data.insights.length > 0 && (
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                  {data.insights.slice(0, 2).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              )}
              <div className="h-[360px] w-full relative">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
                  <div className="flex items-start justify-start p-3">
                    <span className="text-xs font-medium text-muted-foreground/50">
                      Spray &amp; Burn
                    </span>
                  </div>
                  <div className="flex items-start justify-end p-3 text-right">
                    <span className="text-xs font-medium text-muted-foreground/50">
                      Scale Dominators
                    </span>
                  </div>
                  <div className="flex items-end justify-start p-3">
                    <span className="text-xs font-medium text-muted-foreground/50">
                      Testing / Weak
                    </span>
                  </div>
                  <div className="flex items-end justify-end p-3 text-right">
                    <span className="text-xs font-medium text-muted-foreground/50">
                      Selective Winners
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart margin={{ top: 20, right: 30, left: 60, bottom: 70 }}>
                    <XAxis type="number" dataKey="x" name="Avg days live" />
                    <YAxis type="number" dataKey="y" name="Total ads" />
                    <ZAxis type="number" dataKey="score" range={[50, 400]} name="Score" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value: number, name: string) => [value, name]}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload;
                        return (
                          <div className="rounded-md border bg-background p-2 text-sm shadow-md">
                            <p className="font-medium">{p.name}</p>
                            <p>Avg days live: {p.x}</p>
                            <p>Total ads: {p.y}</p>
                            <p>Aggression: {p.score} ({p.tier})</p>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData} name="Brands">
                      {scatterData.map((entry, i) => (
                        <Cell key={i} fill={TIER_COLORS[entry.tier] || 'hsl(0,0%,60%)'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground">
                Quadrants split by medians: {medianX.toFixed(1)} avg days live (X) · {medianY.toFixed(0)} total ads (Y).
              </p>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">Brand</th>
                      <th className="text-right p-2">Ads</th>
                      <th className="text-right p-2">Avg days</th>
                      <th className="text-right p-2">% Video</th>
                      <th className="text-right p-2">Score</th>
                      <th className="text-right p-2">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.brands.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-medium">{row.brandName}</td>
                        <td className="text-right p-2">{row.totalAds}</td>
                        <td className="text-right p-2">{row.avgDaysLive}</td>
                        <td className="text-right p-2">{row.pctVideo}%</td>
                        <td className="text-right p-2">{row.aggressionScore}</td>
                        <td className="text-right p-2">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                            style={{ backgroundColor: TIER_COLORS[row.tier] || '#888' }}
                          />
                          {row.tier}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
