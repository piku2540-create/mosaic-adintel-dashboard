import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { GapOpportunity, ParsedAd } from '@/types';
import { computeGapUsageFromAds } from '@/lib/analytics';

interface GapOpportunitiesProps {
  gaps: GapOpportunity[];
  ads: ParsedAd[];
}

const priorityColor = (priority: number) =>
  priority === 1
    ? 'bg-red-500/10 text-red-700 dark:text-red-300'
    : priority === 2
    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';

const priorityLabel = (priority: number) =>
  priority === 1 ? 'Priority 1 · High confidence' : priority === 2 ? 'Priority 2 · Medium' : 'Priority 3 · Low';

export function GapOpportunities({ gaps, ads }: GapOpportunitiesProps) {
  const usage = computeGapUsageFromAds(ads);

  const sections = [
    { title: 'Emotional gaps', items: usage.emotional },
    { title: 'Funnel gaps', items: usage.funnel },
    { title: 'CTA gaps', items: usage.cta },
  ];

  const hasAny =
    sections.some((s) => s.items.length > 0) || gaps.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className="rounded-2xl bg-white/70 backdrop-blur-lg p-6 shadow-md border border-emerald-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Lightbulb className="h-5 w-5 text-primary" />
            Gap opportunities (prioritized)
          </CardTitle>
          <p className="text-sm text-slate-500">
            Underused emotional triggers, funnel stages, and CTAs ranked by usage.
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          {!hasAny ? (
            <p className="text-sm text-muted-foreground">No clear gaps detected in current selection.</p>
          ) : (
            <div className="space-y-4 text-sm">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="mb-1 font-medium text-foreground">{section.title}</p>
                  {section.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No obvious gaps in this dimension.</p>
                  ) : (
                    <ul className="space-y-2">
                      {section.items.slice(0, 5).map((g) => (
                        <li
                          key={`${section.title}-${g.key}`}
                          className="rounded-md border border-dashed border-primary/30 bg-accent/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground">{g.key || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                Used in {g.pct.toFixed(1)}% of ads ({g.count} creatives).
                              </p>
                            </div>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                priorityColor(g.priority),
                              )}
                            >
                              {priorityLabel(g.priority)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {gaps.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Backend-detected gaps
                  </p>
                  <ul className="space-y-2">
                    {gaps.slice(0, 3).map((g, i) => (
                      <li key={g.description + i} className="rounded-md border bg-accent/10 p-3 text-xs">
                        <p className="font-medium text-foreground">{g.description}</p>
                        <p className="mt-1 text-muted-foreground">{g.opportunity}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
