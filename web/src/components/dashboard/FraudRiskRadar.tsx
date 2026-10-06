import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, ShieldAlertIcon } from 'lucide-react';
import { useFraudRadar } from '../../hooks/useDashboardQueries';
import { SEVERITY_BADGE } from '../../utils/statusStyles';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';
import { ConfidenceGauge } from './ConfidenceGauge';
import { SIGNAL_ICONS } from './iconRegistry';

export function FraudRiskRadar() {
  const query = useFraudRadar();
  const navigate = useNavigate();

  return (
    <Panel title="Fraud Risk Radar" labelledBy="radar-title" to="/patterns" toLabel="Open fraud patterns">
      <QueryState
        query={query}
        skeleton={
        <div className="flex gap-4">
            <Skeleton className="h-[136px] w-[136px] rounded-full" />
            <div className="flex-1 space-y-3 pt-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        }>
        
        {(data) =>
        <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-center gap-4">
              <ConfidenceGauge value={data.detectionConfidence} />
              <div className="inset-well min-w-0 flex-1 rounded-xl border border-line px-3 py-2.5">
                <h3 className="mb-1.5 text-xs font-medium text-ink">Key Signals</h3>
                {data.signals.length === 0 ?
              <p className="py-2 text-xs text-ink-soft">No active signals.</p> :

              <ul className="space-y-1.5">
                    {data.signals.map((s) => {
                  const Icon = SIGNAL_ICONS[s.icon];
                  return (
                    <li key={s.id} className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-xs text-ink">{s.name}</span>
                          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1', SEVERITY_BADGE[s.severity])}>
                            {s.severity}
                          </span>
                        </li>);

                })}
                  </ul>
              }
              </div>
            </div>

            {data.alert ?
          <button
            type="button"
            onClick={() => navigate('/alerts')}
            className="alert-navy group mt-auto flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-[filter] duration-150 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300">
            
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <span className="absolute inset-0 animate-ping rounded-xl bg-rose-400/30 motion-reduce:hidden" aria-hidden />
                  <ShieldAlertIcon className="relative h-[18px] w-[18px] text-rose-300" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-white">{data.alert.title}</span>
                    <span className="tabular rounded-full bg-rose-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-200 ring-1 ring-rose-300/30">
                      {data.alert.accountsAffected} accounts
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-brand-100/80">{data.alert.message}</span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-200 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
              </button> :

          <p className="mt-auto rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-3 text-xs font-medium text-brand-700">
                No high-risk activity right now.
              </p>
          }
          </div>
        }
      </QueryState>
    </Panel>);

}