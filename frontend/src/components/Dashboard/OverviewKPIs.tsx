import { motion } from 'framer-motion';
import { BarChart3, Image, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { BrandSummary } from '@/types';

interface OverviewKPIsProps {
  summaries: BrandSummary[];
  totalAds: number;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export function OverviewKPIs({ summaries, totalAds }: OverviewKPIsProps) {
  const totalVideo = summaries.reduce((a, s) => a + (s.byCreativeType?.Video ?? 0), 0);
  const avgLongevity = summaries.length
    ? Math.round(
        summaries.reduce((a, s) => a + s.avgDaysLive * s.totalAds, 0) /
          summaries.reduce((a, s) => a + s.totalAds, 0)
      )
    : 0;

  const kpis = [
    { label: 'Total ads', value: totalAds, icon: BarChart3 },
    { label: 'Brands', value: summaries.length, icon: Image },
    { label: 'Video ads', value: totalVideo, sub: totalAds ? `${Math.round((totalVideo / totalAds) * 100)}%` : null, icon: MessageSquare },
    { label: 'Avg. days live', value: avgLongevity, icon: Calendar },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {kpis.map((k) => (
        <motion.div key={k.label} variants={item}>
          <Card className="bg-white/70 backdrop-blur-lg rounded-2xl border border-emerald-100 shadow-md transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {k.label}
              </CardTitle>
              <div className="rounded-lg bg-emerald-50 p-2">
                <k.icon className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-display font-bold text-[28px] text-slate-900">
                {k.value}
              </div>
              {k.sub && <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
