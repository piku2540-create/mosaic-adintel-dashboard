import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { PainOfferAlignmentResult } from '@/types';

interface PainOfferAlignmentIntelligenceProps {
  data: PainOfferAlignmentResult | null;
}

export function PainOfferAlignmentIntelligence({ data }: PainOfferAlignmentIntelligenceProps) {
  if (!data) return null;

  const totalAligned = data.byBrand.reduce((a, r) => a + r.alignedCount, 0);
  const totalWithPain = data.byBrand.reduce((a, r) => a + r.totalWithPainPoint, 0);
  const overallPct = totalWithPain ? Math.round((totalAligned / totalWithPain) * 10) / 10 : 0;
  const healthClass =
    overallPct > 70
      ? 'text-emerald-700 dark:text-emerald-400'
      : overallPct >= 50
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-red-700 dark:text-red-300';

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
            Pain–Offer Alignment Intelligence
          </CardTitle>
          <p className="text-sm text-slate-500">
            % of ads with a pain point that also have a non-empty offer. Aligned = pain + offer present.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {data.byBrand.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pain-point data in the current selection. Adjust filters or ensure Primary_Pain_Point is populated.
            </p>
          ) : (
            <>
              <div className="rounded-md bg-muted/40 p-3 text-sm">
                <span className="font-medium text-foreground">Overall Alignment Health:</span>{' '}
                <span className={`font-semibold ${healthClass}`}>{overallPct}%</span>
              </div>
              {data.insights.length > 0 && (
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                  {data.insights.slice(0, 2).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Top 5 alignment</h4>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Brand</th>
                          <th className="text-right p-2">Aligned</th>
                          <th className="text-right p-2">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topBrands.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{row.brandName}</td>
                            <td className="text-right p-2">
                              {row.alignedCount}/{row.totalWithPainPoint}
                            </td>
                            <td className="text-right p-2 font-medium">{row.alignmentPct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Bottom 5 alignment</h4>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2">Brand</th>
                          <th className="text-right p-2">Aligned</th>
                          <th className="text-right p-2">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.bottomBrands.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{row.brandName}</td>
                            <td className="text-right p-2">
                              {row.alignedCount}/{row.totalWithPainPoint}
                            </td>
                            <td className="text-right p-2 font-medium">{row.alignmentPct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Top 10 Pain + Offer combinations</h4>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2">Pain point</th>
                        <th className="text-left p-2">Offer type</th>
                        <th className="text-right p-2">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topCombos.map((combo, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{combo.pain}</td>
                          <td className="p-2">{combo.offer}</td>
                          <td className="text-right p-2">{combo.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Alignment % per brand</h4>
                <div className="rounded-md border overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-right p-2">With pain</th>
                        <th className="text-right p-2">Aligned</th>
                        <th className="text-right p-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byBrand
                        .sort((a, b) => b.alignmentPct - a.alignmentPct)
                        .map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{row.brandName}</td>
                            <td className="text-right p-2">{row.totalWithPainPoint}</td>
                            <td className="text-right p-2">{row.alignedCount}</td>
                            <td className="text-right p-2">{row.alignmentPct}%</td>
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
