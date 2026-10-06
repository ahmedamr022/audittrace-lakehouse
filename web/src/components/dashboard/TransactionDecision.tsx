import React from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { useTransactionDecisions } from '../../hooks/useDashboardQueries';
import { formatCompact, formatPercent } from '../../utils/format';
import { DECISION_COLOR, decisionDotClass } from '../../utils/statusStyles';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';

export function TransactionDecision() {
  const query = useTransactionDecisions();

  return (
    <Panel title="Transaction Decision" labelledBy="decision-title" headerClassName="mb-2" to="/transactions" toLabel="Open transactions">
      <QueryState
        query={query}
        skeleton={
        <div className="flex items-center gap-4">
            <Skeleton className="h-[100px] w-[100px] rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        }>
        
        {(data) =>
        <div className="flex items-center gap-4">
            <div className="relative h-[100px] w-[100px] shrink-0" role="img" aria-label={`Total ${formatCompact(data.total)} transactions`}>
              <PieChart width={100} height={100}>
                <Pie
                data={data.breakdown}
                dataKey="percent"
                nameKey="decision"
                innerRadius={38}
                outerRadius={49}
                startAngle={90}
                endAngle={-270}
                paddingAngle={1.5}
                stroke="none"
                isAnimationActive={false}>
                
                  {data.breakdown.map((b) =>
                <Cell key={b.decision} fill={DECISION_COLOR[b.decision]} />
                )}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular text-base font-semibold leading-none text-ink">{formatCompact(data.total)}</span>
                <span className="mt-0.5 text-[10.5px] text-ink-muted">Total</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {data.breakdown.map((b) =>
            <li key={b.decision} className="flex items-center justify-between gap-2 text-xs" title={`${b.count.toLocaleString('en-US')} transactions`}>
                  <span className="flex items-center gap-2 text-ink">
                    <span className={cn('h-2.5 w-2.5 rounded-full', decisionDotClass(b.decision))} aria-hidden />
                    {b.decision}
                  </span>
                  <span className="tabular text-ink-muted">{formatPercent(b.percent)}</span>
                </li>
            )}
            </ul>
          </div>
        }
      </QueryState>
    </Panel>);

}