import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { BrandSummary } from '@/types';
import type { AdCreativeType } from '@/types';

const COLORS: Record<AdCreativeType, string> = {
  Static: '#6EE7B7',
  Video: '#34D399',
  Carousel: '#FDE68A',
};

interface AdFormatDistributionProps {
  summaries: BrandSummary[];
}

export function AdFormatDistribution({ summaries }: AdFormatDistributionProps) {
  const data = summaries.map((s) => ({
    name: s.brandName,
    Static: s.byCreativeType?.Static ?? 0,
    Video: s.byCreativeType?.Video ?? 0,
    Carousel: s.byCreativeType?.Carousel ?? 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-800">
            Ad format by brand
          </CardTitle>
          <p className="text-sm text-slate-500">Static vs Video vs Carousel</p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Static" stackId="a" fill={COLORS.Static} name="Static" />
                <Bar dataKey="Video" stackId="a" fill={COLORS.Video} name="Video" />
                <Bar dataKey="Carousel" stackId="a" fill={COLORS.Carousel} name="Carousel" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
