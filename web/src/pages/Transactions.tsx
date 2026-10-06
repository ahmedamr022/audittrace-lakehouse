import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, SearchIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { regionOptions } from '../data/operationsMock';
import { useTransactions } from '../hooks/useOperationsQueries';
import { formatClock, formatCurrency } from '../utils/format';
import { DECISION_BADGE, decisionDotClass, riskScoreClass } from '../utils/statusStyles';
import { cn } from '../utils/cn';
import { StreamControl } from '../components/layout/StreamControl';
import { Button } from '../components/ui/Button';
import { PageTitle } from '../components/ui/PageTitle';
import { QueryState } from '../components/ui/QueryState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import type { Decision } from '../types/dashboard';

const PAGE_SIZE = 12;
type DecisionFilter = Decision | 'all';

export function Transactions() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const decision = params.get('decision') as DecisionFilter ?? 'all';
  const region = params.get('region') ?? 'all';
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const [draft, setDraft] = useState(q);

  useEffect(() => setDraft(q), [q]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => v && v !== 'all' ? next.set(k, v) : next.delete(k));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const query = useTransactions({ q, decision, region, page, pageSize: PAGE_SIZE });
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportCsv = () => {
    const rows = query.data?.items ?? [];
    if (rows.length === 0) {
      toast.info('Nothing to export for these filters');
      return;
    }
    const header = 'timestamp,transaction_id,region,amount,currency,risk_score,decision';
    const body = rows.map((t) => [t.timestamp, t.transactionId, t.region, t.amount, t.currency, t.riskScore, t.decision].join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`${header}\n${body}`], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} transactions`);
  };

  return (
    <>
      <PageTitle
        title="Transactions"
        subtitle="Search and filter every scored transaction from the lakehouse."
        actions={
        <>
            <Button icon={<DownloadIcon className="h-4 w-4" aria-hidden />} onClick={exportCsv}>
              Export CSV
            </Button>
            <StreamControl />
          </>
        } />
      

      <section className="panel mt-4 p-4" aria-label="Transactions">
        <div className="flex flex-wrap items-center gap-3">
          <form
            className="relative min-w-[240px] flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: draft.trim() });
            }}>
            
            <label htmlFor="tx-search" className="sr-only">
              Search by transaction ID or country code
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <input
              id="tx-search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Transaction ID or country code, then Enter"
              className="inset-well h-10 w-full rounded-xl border border-line pl-9 pr-9 text-[13px] text-ink placeholder:text-ink-soft focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100" />
            
            {q &&
            <button type="button" aria-label="Clear search" onClick={() => update({ q: '' })} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-soft hover:bg-brand-50 hover:text-ink">
                <XIcon className="h-3.5 w-3.5" aria-hidden />
              </button>
            }
          </form>
          <SegmentedControl<DecisionFilter>
            label="Decision"
            value={decision}
            onChange={(v) => update({ decision: v })}
            options={[
            { value: 'all', label: 'All' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Review', label: 'Review' },
            { value: 'Declined', label: 'Declined' }]
            } />
          
          <label className="sr-only" htmlFor="tx-region">
            Region
          </label>
          <select
            id="tx-region"
            value={region}
            onChange={(e) => update({ region: e.target.value })}
            className="inset-well h-10 rounded-xl border border-line px-3 text-[13px] text-ink focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100">
            
            <option value="all">All regions</option>
            {regionOptions.map((r) =>
            <option key={r} value={r}>
                {r}
              </option>
            )}
          </select>
        </div>

        <div className="mt-4">
          <QueryState
            query={query}
            isEmpty={(d) => d.items.length === 0}
            emptyMessage="No transactions match these filters."
            skeleton={
            <div className="space-y-2.5">
                {Array.from({ length: 8 }, (_, i) =>
              <Skeleton key={i} className="h-9 w-full" />
              )}
              </div>
            }>
            
            {(data) =>
            <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="text-[11px] text-ink-muted">
                      {['Time', 'Transaction ID', 'Region', 'Amount', 'Risk Score', 'Decision'].map((c) =>
                    <th key={c} scope="col" className="px-3 pb-2 font-medium">
                          {c}
                        </th>
                    )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((t) =>
                  <tr key={t.id} className="border-t border-line/70 transition-colors duration-150 hover:bg-brand-50/50">
                        <td className="px-3 py-2.5">
                          <span className="tabular flex items-center gap-2.5 text-xs text-ink">
                            <span className={cn('h-2.5 w-2.5 rounded-full', decisionDotClass(t.decision))} aria-hidden />
                            {formatClock(t.timestamp)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-ink">{t.transactionId}</td>
                        <td className="px-3 py-2.5 text-xs text-ink">{t.region}</td>
                        <td className="tabular px-3 py-2.5 text-xs text-ink">{formatCurrency(t.amount, t.currency)}</td>
                        <td className={cn('tabular px-3 py-2.5 text-xs font-semibold', riskScoreClass(t.riskScore))}>{t.riskScore}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn('inline-block min-w-[70px] rounded-full px-2 py-0.5 text-center text-[11px] font-medium ring-1', DECISION_BADGE[t.decision])}>
                            {t.decision}
                          </span>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            }
          </QueryState>
        </div>

        <footer className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <p className="tabular text-xs text-ink-muted">
            {total === 0 ? 'No results' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total.toLocaleString('en-US')}`}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} icon={<ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />}>
              Previous
            </Button>
            <span className="tabular text-xs text-ink-muted">
              {page} / {pages}
            </span>
            <Button size="sm" disabled={page >= pages} onClick={() => update({ page: String(page + 1) })}>
              Next <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        </footer>
      </section>
    </>);

}