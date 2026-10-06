import React from 'react';
import { motion } from 'framer-motion';
import { useFraudPatterns } from '../../hooks/useDashboardQueries';
import { formatPercent } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';

export function TopFraudPatterns({ className }: {className?: string;}) {
  const query = useFraudPatterns(5);

  return (
    <Panel title="Top Fraud Patterns" labelledBy="patterns-title" className={cn(className)} to="/patterns" toLabel="Open fraud patterns">
      <QueryState
        query={query}
        isEmpty={(d) => d.length === 0}
        emptyMessage="No fraud patterns detected."
        skeleton={
        <div className="space-y-5">
            {Array.from({ length: 5 }, (_, i) =>
          <Skeleton key={i} className="h-6 w-full" />
          )}
          </div>
        }>
        
        {(patterns) => {
          const max = Math.max(...patterns.map((p) => p.percent), 1);
          return (
            <ol className="flex flex-1 flex-col justify-around gap-3">
              {patterns.map((p, i) =>
              <li key={p.id} className="flex items-center gap-3">
                  <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-white text-xs font-medium text-ink">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs text-ink">{p.name}</span>
                      <span className="tabular text-xs text-ink-muted">{formatPercent(p.percent)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-50">
                      <motion.div
                      className="brand-bar h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${p.percent / max * 72}%` }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }} />
                    
                    </div>
                  </div>
                </li>
              )}
            </ol>);

        }}
      </QueryState>
    </Panel>);

}