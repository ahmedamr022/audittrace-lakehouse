import React from 'react';
import { ArrowDownIcon, ArrowUpIcon, RefreshCwIcon } from 'lucide-react';
import { useKpis } from '../../hooks/useDashboardQueries';
import { formatDelta, formatKpiValue } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Skeleton } from '../ui/Skeleton';
import { Sparkline } from '../ui/Sparkline';
import { TiltCard } from '../ui/TiltCard';
import { KPI_ICONS } from './iconRegistry';
import type { KpiId, KpiMetric } from '../../types/dashboard';

const GRID = 'grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.2fr_1.08fr_1.06fr_1fr_0.95fr]';

/** Where each KPI card leads when clicked. */
const KPI_LINKS: Record<KpiId, string> = {
  total_transactions: '/transactions',
  fraud_risk: '/patterns',
  blocked_value: '/alerts',
  avg_processing: '/lakehouse',
  data_quality: '/lakehouse'
};

export function KpiStrip() {
  const query = useKpis();

  if (query.isLoading && !query.data) {
    return (
      <div className={GRID} role="status" aria-label="Loading metrics">
        {Array.from({ length: 5 }, (_, i) =>
        <div key={i} className="panel-raised flex gap-3 p-4">
            <Skeleton className="h-11 w-11 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        )}
      </div>);

  }

  if (query.error && !query.data) {
    return (
      <div role="alert" className="panel flex items-center justify-between p-4">
        <p className="text-sm text-ink-muted">Couldn't load key metrics. {query.error.message}</p>
        <button type="button" onClick={query.refetch} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700">
          <RefreshCwIcon className="h-3.5 w-3.5" aria-hidden /> Retry
        </button>
      </div>);

  }

  return (
    <div className={GRID}>
      {(query.data ?? []).map((m) =>
      <KpiCard key={m.id} metric={m} />
      )}
    </div>);

}

function KpiCard({ metric }: {metric: KpiMetric;}) {
  const Icon = KPI_ICONS[metric.id];
  const { value, unit } = formatKpiValue(metric);
  const up = metric.deltaPercent >= 0;
  const isBlocked = metric.id === 'blocked_value';

  return (
    <TiltCard to={KPI_LINKS[metric.id]} label={`${metric.label}: ${value}${unit ? ` ${unit}` : ''}`} className="p-4">
      <div className="flex min-w-0 gap-3">
        <span className="icon-3d mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-medium text-ink-muted">{metric.label}</h3>
          <p className="tabular mt-1 whitespace-nowrap text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
            {value}
            {unit && <span className="ml-1 text-lg font-medium text-ink-muted">{unit}</span>}
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-2">
            {metric.deltaPercent !== 0 ?
            <span
              className={cn(
                'tabular inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                metric.isPositive ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-600'
              )}>
              
                {up ? <ArrowUpIcon className="h-3 w-3" aria-hidden /> : <ArrowDownIcon className="h-3 w-3" aria-hidden />}
                {formatDelta(metric.deltaPercent)}
              </span> :

            <span className="text-[11px] text-ink-soft">Stable</span>
            }
            <Sparkline values={metric.sparkline} width={96} color={isBlocked ? '#a78bfa' : '#7dd3fc'} colorEnd={isBlocked ? '#38bdf8' : '#0284c7'} />
          </div>
        </div>
      </div>
    </TiltCard>);

}