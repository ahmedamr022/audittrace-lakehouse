import React from 'react';
import { motion } from 'framer-motion';
import { useRiskDistribution } from '../../hooks/useDashboardQueries';
import { formatPercent } from '../../utils/format';
import { RISK_LEVEL_BAR, RISK_LEVEL_DOT } from '../../utils/statusStyles';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';

export function RiskDistribution() {
  const query = useRiskDistribution();

  return (
    <Panel title="Risk Distribution" labelledBy="riskdist-title" headerClassName="mb-2" to="/transactions" toLabel="Open transactions">
      <QueryState
        query={query}
        isEmpty={(d) => d.length === 0}
        skeleton={
        <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) =>
          <Skeleton key={i} className="h-3.5 w-full" />
          )}
          </div>
        }>
        
        {(items) =>
        <ul className="space-y-2.5">
            {items.map((item) =>
          <li key={item.level} className="grid grid-cols-[72px_1fr_44px] items-center gap-3" title={`${item.count.toLocaleString('en-US')} transactions`}>
                <span className="flex items-center gap-2 text-xs text-ink">
                  <span className={cn('h-2.5 w-2.5 rounded-full', RISK_LEVEL_DOT[item.level])} aria-hidden />
                  {item.level}
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-brand-50" role="progressbar" aria-label={item.level} aria-valuenow={item.percent} aria-valuemin={0} aria-valuemax={100}>
                  <motion.span
                className={cn('block h-full rounded-full', RISK_LEVEL_BAR[item.level])}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(item.percent, 3)}%` }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} />
              
                </span>
                <span className="tabular text-right text-xs text-ink-muted">{formatPercent(item.percent)}</span>
              </li>
          )}
          </ul>
        }
      </QueryState>
    </Panel>);

}