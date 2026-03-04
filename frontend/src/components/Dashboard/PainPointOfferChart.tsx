import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { ParsedAd } from '@/types';
import { computePainOfferInsights } from '@/lib/analytics';

interface PainPointOfferChartProps {
  ads: ParsedAd[];
}

export function PainPointOfferChart({ ads }: PainPointOfferChartProps) {
  const { rows, topCombos, orphanPains, orphanOffers } = computePainOfferInsights(ads);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-800">
            Pain point vs offer distribution
          </CardTitle>
          <p className="text-sm text-slate-500">
            Reveals dominant pain + offer combinations and misaligned messaging.
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          {ads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ads in the current selection. Adjust filters or date range to see distribution.
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pain point or offer data found for the current selection.
            </p>
          ) : (
            <>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ left: 0, right: 16 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pain" name="Primary pain point" fill="#6EE7B7" />
                    <Bar dataKey="offer" name="Offer type" fill="#93C5FD" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs sm:text-sm space-y-1">
                {topCombos.length > 0 && (
                  <p className="text-foreground">
                    Top pain + offer combos:{' '}
                    {topCombos
                      .map(
                        (c) => `${c.pain} + ${c.offer} (${c.count} ads)`,
                      )
                      .join(' · ')}
                  </p>
                )}
                {orphanPains.length > 0 && (
                  <p className="text-amber-700 dark:text-amber-400">
                    Pain points without matching offers: {orphanPains.slice(0, 3).join(', ')}
                    {orphanPains.length > 3 ? '…' : ''}.
                  </p>
                )}
                {orphanOffers.length > 0 && (
                  <p className="text-amber-700 dark:text-amber-400">
                    Offers without strong pain alignment: {orphanOffers.slice(0, 3).join(', ')}
                    {orphanOffers.length > 3 ? '…' : ''}.
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

