import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { CreativeStrengthResult, CompetitorAggressionResult, ParsedAd } from '@/types';
import { computeThemeSaturation } from '@/lib/analytics';

interface StrategicSnapshotProps {
  creativeStrength: CreativeStrengthResult | null;
  aggression: CompetitorAggressionResult | null;
  ads: ParsedAd[];
}

export function StrategicSnapshot({ creativeStrength, aggression, ads }: StrategicSnapshotProps) {
  const bullets = useMemo(() => {
    const out: string[] = [];

    const bestFormat = creativeStrength?.avgByFormat?.length
      ? [...creativeStrength.avgByFormat].sort((a, b) => b.avgScore - a.avgScore)[0]
      : null;
    if (bestFormat) {
      out.push(`Strongest format by creative strength: ${bestFormat.format} (avg ${bestFormat.avgScore}).`);
    } else {
      out.push('Strongest format by creative strength: N/A.');
    }

    const mostAggressive = aggression?.brands?.length ? aggression.brands[0] : null;
    if (mostAggressive) {
      out.push(`Most aggressive brand: ${mostAggressive.brandName} (score ${mostAggressive.aggressionScore}).`);
    } else {
      out.push('Most aggressive brand: N/A.');
    }

    const whitespaceTheme = (() => {
      if (!ads.length) return null;
      const sat = computeThemeSaturation(ads);
      const candidates = sat.filter((t) => t.share > 0 && t.share < 0.1);
      if (!candidates.length) return null;
      return [...candidates].sort((a, b) => b.share - a.share)[0];
    })();

    if (whitespaceTheme) {
      out.push(`Biggest message-theme white space: ${whitespaceTheme.theme} (${(whitespaceTheme.share * 100).toFixed(1)}%).`);
    } else {
      out.push('Biggest message-theme white space: N/A.');
    }

    return out.slice(0, 3);
  }, [creativeStrength, aggression, ads]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Compass className="h-5 w-5 text-primary" />
            Strategic Snapshot
          </CardTitle>
          <p className="text-sm text-slate-500">Executive signals from the current filtered selection.</p>
        </CardHeader>
        <CardContent className="pt-2">
          <ul className="list-disc pl-4 space-y-1 text-sm text-slate-600">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

