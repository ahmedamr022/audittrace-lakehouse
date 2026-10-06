import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheckIcon, EyeIcon, RotateCcwIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAlerts } from '../hooks/useOperationsQueries';
import { lakehouseApi } from '../utils/lakehouseClient';
import { formatCurrency, formatRelative } from '../utils/format';
import { SEVERITY_BADGE, SEVERITY_DOT } from '../utils/statusStyles';
import { cn } from '../utils/cn';
import { StreamControl } from '../components/layout/StreamControl';
import { Button } from '../components/ui/Button';
import { PageTitle } from '../components/ui/PageTitle';
import { QueryState } from '../components/ui/QueryState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import type { Severity } from '../types/dashboard';
import type { AlertStatus, RiskAlertItem } from '../types/operations';

type StatusFilter = AlertStatus | 'all';
const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUS_LABEL: Record<AlertStatus, string> = { open: 'Open', acknowledged: 'Acknowledged', resolved: 'Resolved' };

export function Alerts() {
  const query = useAlerts();
  const [status, setStatus] = useState<StatusFilter>('open');
  const [severities, setSeverities] = useState<Set<Severity>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  const setAlertStatus = async (alert: RiskAlertItem, next: AlertStatus) => {
    setPending(alert.id);
    query.mutate((prev) => prev?.map((a) => a.id === alert.id ? { ...a, status: next } : a) ?? prev);
    try {
      await lakehouseApi.updateAlertStatus(alert.id, next);
      toast.success(`Alert ${STATUS_LABEL[next].toLowerCase()}`, { description: alert.title });
    } catch (e) {
      query.mutate((prev) => prev?.map((a) => a.id === alert.id ? alert : a) ?? prev);
      toast.error('Could not update alert', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setPending(null);
    }
  };

  const toggleSeverity = (s: Severity) =>
  setSeverities((prev) => {
    const n = new Set(prev);
    if (n.has(s)) n.delete(s);else
    n.add(s);
    return n;
  });

  const count = (s: AlertStatus) => query.data?.filter((a) => a.status === s).length;

  return (
    <>
      <PageTitle title="Alerts" subtitle="Triage high-risk activity detected across your transaction stream." actions={<StreamControl />} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<StatusFilter>
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
          { value: 'open', label: 'Open', count: count('open') },
          { value: 'acknowledged', label: 'Acknowledged', count: count('acknowledged') },
          { value: 'resolved', label: 'Resolved', count: count('resolved') },
          { value: 'all', label: 'All', count: query.data?.length }]
          } />
        
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Severity filter">
          {SEVERITIES.map((s) => {
            const on = severities.has(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSeverity(s)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium ring-1 transition-colors duration-150',
                  on ? SEVERITY_BADGE[s] : 'bg-white text-ink-muted ring-line hover:text-ink'
                )}>
                
                <span className={cn('h-2 w-2 rounded-full', SEVERITY_DOT[s])} aria-hidden />
                {s}
              </button>);

          })}
        </div>
      </div>

      <section className="panel mt-3.5 p-2" aria-label="Alerts list">
        <QueryState
          query={query}
          skeleton={
          <div className="space-y-2 p-2">
              {Array.from({ length: 5 }, (_, i) =>
            <Skeleton key={i} className="h-20 w-full" />
            )}
            </div>
          }>
          
          {(alerts) => {
            const list = alerts.filter((a) => (status === 'all' || a.status === status) && (severities.size === 0 || severities.has(a.severity)));
            if (list.length === 0) {
              return (
                <div className="flex flex-col items-center gap-2 py-14 text-center">
                  <span className="icon-soft flex h-11 w-11 items-center justify-center rounded-2xl">
                    <CheckCheckIcon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-ink">Nothing here</p>
                  <p className="text-xs text-ink-soft">No alerts match these filters.</p>
                </div>);

            }
            return (
              <ul className="divide-y divide-line">
                {list.map((a) =>
                <li key={a.id} className="grid grid-cols-1 gap-3 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-center">
                    <div className="flex min-w-0 gap-3">
                      <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', SEVERITY_DOT[a.severity])} aria-hidden />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{a.title}</span>
                          <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1', SEVERITY_BADGE[a.severity])}>{a.severity}</span>
                          {a.status !== 'open' && <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10.5px] font-medium text-ink-muted ring-1 ring-line">{STATUS_LABEL[a.status]}</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">{a.message}</p>
                        <p className="mt-1 text-[11px] text-ink-soft">
                          {a.pattern} · {a.region} · {formatRelative(a.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="tabular text-xs lg:text-right">
                      <p className="font-semibold text-ink">{a.amountAtRisk > 0 ? formatCurrency(a.amountAtRisk, a.currency) : '—'}</p>
                      <p className="text-ink-soft">{a.accountsAffected} accounts at risk</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {a.region?.length === 2 &&
                    <Link to={`/transactions?region=${a.region}`} aria-label={`Investigate ${a.title}`} className="icon-soft flex h-8 w-8 items-center justify-center rounded-lg">
                          <SearchIcon className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                    }
                      {a.status === 'open' &&
                    <Button size="sm" loading={pending === a.id} icon={<EyeIcon className="h-3.5 w-3.5" aria-hidden />} onClick={() => setAlertStatus(a, 'acknowledged')}>
                          Acknowledge
                        </Button>
                    }
                      {a.status !== 'resolved' ?
                    <Button size="sm" variant="primary" disabled={pending === a.id} icon={<CheckCheckIcon className="h-3.5 w-3.5" aria-hidden />} onClick={() => setAlertStatus(a, 'resolved')}>
                          Resolve
                        </Button> :

                    <Button size="sm" loading={pending === a.id} icon={<RotateCcwIcon className="h-3.5 w-3.5" aria-hidden />} onClick={() => setAlertStatus(a, 'open')}>
                          Reopen
                        </Button>
                    }
                    </div>
                  </li>
                )}
              </ul>);

          }}
        </QueryState>
      </section>
    </>);

}