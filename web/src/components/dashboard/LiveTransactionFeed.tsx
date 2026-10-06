import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStream } from '../../contexts/StreamContext';
import { useLiveFeed } from '../../hooks/useDashboardQueries';
import { formatClock, formatCurrency } from '../../utils/format';
import { DECISION_BADGE, decisionDotClass, riskScoreClass } from '../../utils/statusStyles';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';

const COLS = ['Time', 'Transaction ID', 'Region', 'Amount', 'Risk Score', 'Decision'];

export function LiveTransactionFeed({ className }: {className?: string;}) {
  const query = useLiveFeed(5);
  const { isLive } = useStream();

  return (
    <Panel
      className={cn('pb-2', className)}
      labelledBy="feed-title"
      headerClassName="mb-2"
      to="/transactions"
      toLabel="View all transactions"
      title={
      <span className="flex items-center gap-6">
          Live Transaction Feed
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand-600">
            <span className={cn('h-2 w-2 rounded-full', isLive ? 'bg-brand-500' : 'bg-ink-soft')} aria-hidden />
            {isLive ? 'Streaming...' : 'Paused'}
          </span>
        </span>
      }>
      
      <QueryState
        query={query}
        isEmpty={(d) => d.length === 0}
        emptyMessage="Waiting for transactions…"
        skeleton={
        <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }, (_, i) =>
          <Skeleton key={i} className="h-5 w-full" />
          )}
          </div>
        }>
        
        {(rows) =>
        <div className="-mx-1 overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr>
                  {COLS.map((c, i) =>
                <th key={c} scope="col" className={cn('px-1 pb-1.5 text-[10.5px] font-medium text-ink-muted', i === 0 && 'pl-7', i === 5 && 'text-center')}>
                      {c}
                    </th>
                )}
                </tr>
              </thead>
              <tbody aria-live="polite">
                <AnimatePresence initial={false}>
                  {rows.map((t) =>
                <motion.tr
                  key={t.id}
                  layout="position"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="border-t border-line/70">
                  
                      <td className="px-1 py-[7px]">
                        <span className="tabular flex items-center gap-2.5 text-xs text-ink">
                          <span className={cn('h-3 w-3 shrink-0 rounded-full', decisionDotClass(t.decision))} aria-hidden />
                          {formatClock(t.timestamp)}
                        </span>
                      </td>
                      <td className="max-w-[120px] truncate px-1 py-[7px] font-mono text-[11.5px] text-ink" title={t.transactionId}>
                        {t.transactionId.length > 12 ? `${t.transactionId.slice(0, 11)}…` : t.transactionId}
                      </td>
                      <td className="px-1 py-[7px] text-xs text-ink">{t.region}</td>
                      <td className="tabular px-1 py-[7px] text-xs text-ink">{formatCurrency(t.amount, t.currency)}</td>
                      <td className={cn('tabular px-1 py-[7px] text-xs font-medium', riskScoreClass(t.riskScore))}>{t.riskScore}</td>
                      <td className="px-1 py-[7px] text-center">
                        <span className={cn('inline-block min-w-[62px] rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1', DECISION_BADGE[t.decision])}>
                          {t.decision}
                        </span>
                      </td>
                    </motion.tr>
                )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        }
      </QueryState>
    </Panel>);

}