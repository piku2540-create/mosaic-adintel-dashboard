import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { CreativeStrengthResult } from '@/types';

interface CreativeStrengthIntelligenceProps {
  data: CreativeStrengthResult | null;
}

export function CreativeStrengthIntelligence({ data }: CreativeStrengthIntelligenceProps) {
  if (!data) return null;

  const top10 = [...data.items].sort((a, b) => b.creativeStrengthScore - a.creativeStrengthScore).slice(0, 10);
  const bottom10 = [...data.items].sort((a, b) => a.creativeStrengthScore - b.creativeStrengthScore).slice(0, 10);

  const badgeLabel = (pct: number): string | null => {
    if (pct >= 90) return 'Top 10%';
    if (pct >= 75) return 'Top 25%';
    if (pct >= 40 && pct <= 60) return 'Median';
    if (pct <= 25) return 'Bottom 25%';
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Zap className="h-5 w-5 text-primary" />
            Creative Strength Intelligence
          </CardTitle>
          <p className="text-sm text-slate-500">
            Score combines longevity percentile, active status, format and funnel performance (0–100).
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ads in the current selection. Adjust filters to see creative strength.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Top 10 strongest creatives</h4>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Brand · Format</th>
                          <th className="text-right p-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top10.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">
                              {item.ad.brandName} · {item.ad.adCreativeType}
                            </td>
                            <td className="text-right p-2 font-medium">
                              <span className="inline-flex items-center justify-end gap-2">
                                <span>{item.creativeStrengthScore}</span>
                                {badgeLabel(item.creativeStrengthPercentile) && (
                                  <span className="rounded-full border bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    {badgeLabel(item.creativeStrengthPercentile)}
                                  </span>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Bottom 10 weakest creatives</h4>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Brand · Format</th>
                          <th className="text-right p-2">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bottom10.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">
                              {item.ad.brandName} · {item.ad.adCreativeType}
                            </td>
                            <td className="text-right p-2 font-medium">
                              <span className="inline-flex items-center justify-end gap-2">
                                <span>{item.creativeStrengthScore}</span>
                                {badgeLabel(item.creativeStrengthPercentile) && (
                                  <span className="rounded-full border bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    {badgeLabel(item.creativeStrengthPercentile)}
                                  </span>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Avg strength by brand</h4>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Brand</th>
                          <th className="text-right p-2">Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.avgByBrand.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{row.brandName}</td>
                            <td className="text-right p-2">{row.avgScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Avg strength by format</h4>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Format</th>
                          <th className="text-right p-2">Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.avgByFormat.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{row.format}</td>
                            <td className="text-right p-2">{row.avgScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
