import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { EmotionFormatMatrixResult } from '@/types';

interface EmotionIntelligenceMatrixProps {
  data: EmotionFormatMatrixResult | null;
}

export function EmotionIntelligenceMatrix({ data }: EmotionIntelligenceMatrixProps) {
  const heatmapGrid = useMemo(() => {
    if (!data?.cells.length) return { rows: [] as string[], cols: [] as string[], values: new Map<string, number>() };
    const emotions = Array.from(new Set(data.cells.map((c) => c.emotionalTrigger))).sort();
    const formats = Array.from(new Set(data.cells.map((c) => c.adFormat))).sort();
    const values = new Map<string, number>();
    for (const c of data.cells) {
      values.set(`${c.emotionalTrigger}|${c.adFormat}`, c.avgDaysLive);
    }
    return { rows: emotions, cols: formats, values };
  }, [data?.cells]);

  if (!data) return null;

  const maxVal = data.cells.length
    ? Math.max(...data.cells.map((c) => c.avgDaysLive))
    : 0;
  const minVal = data.cells.length
    ? Math.min(...data.cells.map((c) => c.avgDaysLive))
    : 0;
  const range = maxVal - minVal || 1;

  const strategicLine = useMemo(() => {
    if (!data.cells.length) return 'No clear underused-high longevity emotion cluster detected.';
    const avgAll = data.cells.reduce((a, c) => a + c.avgDaysLive, 0) / data.cells.length;
    const best = data.cells
      .filter((c) => c.flagUnderusedHighLongevity)
      .sort((a, b) => b.avgDaysLive - a.avgDaysLive)[0];
    if (!best || avgAll <= 0) return 'No clear underused-high longevity emotion cluster detected.';
    const ratio = best.avgDaysLive / avgAll;
    return `${best.emotionalTrigger} + ${best.adFormat} lasts ${ratio.toFixed(1)}x longer than average but is underused.`;
  }, [data.cells]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Heart className="h-5 w-5 text-primary" />
            Emotion Intelligence Matrix
          </CardTitle>
          <p className="text-sm text-slate-500">
            Avg days live by Emotional trigger × Ad format (min 5 ads). Flags: underused+high longevity, overused+low longevity.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {data.cells.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No emotion×format combinations with 5+ ads. Widen filters or add data.
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
              {heatmapGrid.rows.length > 0 && heatmapGrid.cols.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1 border bg-muted/50 text-left w-24">Emotion \ Format</th>
                          {heatmapGrid.cols.map((col) => (
                            <th key={col} className="p-1 border bg-muted/50 text-center max-w-[80px] truncate" title={col}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapGrid.rows.map((row) => (
                          <tr key={row}>
                            <td className="p-1 border font-medium truncate max-w-[100px]" title={row}>
                              {row}
                            </td>
                            {heatmapGrid.cols.map((col) => {
                              const val = heatmapGrid.values.get(`${row}|${col}`);
                              const pct = val != null ? (val - minVal) / range : 0;
                              const bg = val != null
                                ? `hsl(160, 55%, ${92 - pct * 35}%)`
                                : 'hsl(0,0%,96%)';
                              return (
                                <td
                                  key={col}
                                  className="p-1 border text-center"
                                  style={{ backgroundColor: bg }}
                                  title={val != null ? `Avg ${val} days` : '—'}
                                >
                                  {val != null ? val : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{strategicLine}</p>
              <div>
                <h4 className="text-sm font-medium mb-2">Ranked (avg days live)</h4>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2">Emotion</th>
                        <th className="text-left p-2">Format</th>
                        <th className="text-right p-2">Count</th>
                        <th className="text-right p-2">Avg days</th>
                        <th className="text-right p-2">% active</th>
                        <th className="text-left p-2">Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cells.map((cell, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{cell.emotionalTrigger}</td>
                          <td className="p-2">{cell.adFormat}</td>
                          <td className="text-right p-2">{cell.count}</td>
                          <td className="text-right p-2">{cell.avgDaysLive}</td>
                          <td className="text-right p-2">{cell.pctActive}%</td>
                          <td className="p-2">
                            {cell.flagUnderusedHighLongevity && (
                              <span className="text-emerald-600 dark:text-emerald-400 mr-1">Underused+High</span>
                            )}
                            {cell.flagOverusedLowLongevity && (
                              <span className="text-amber-600 dark:text-amber-400">Overused+Low</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
