import React, { Fragment } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { useInfrastructure } from '../../hooks/useDashboardQueries';
import { HEALTH_DOT, HEALTH_LABEL } from '../../utils/statusStyles';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';
import { INFRA_ICONS } from './iconRegistry';

export function LocalInfrastructure() {
  const query = useInfrastructure();
  const allHealthy = query.data?.every((s) => s.status === 'healthy') ?? true;

  return (
    <Panel
      labelledBy="infra-title"
      to="/lakehouse"
      toLabel="Open data lakehouse"
      title={
      <span className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', allHealthy ? 'bg-brand-500' : 'bg-review')} aria-hidden />
          Local Infrastructure
        </span>
      }>
      
      <QueryState
        query={query}
        isEmpty={(d) => d.length === 0}
        skeleton={
        <div className="flex justify-between gap-3">
            {Array.from({ length: 5 }, (_, i) =>
          <Skeleton key={i} className="h-[96px] w-[84px] rounded-xl" />
          )}
          </div>
        }>
        
        {(services) =>
        <ol className="flex items-start justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {services.map((s, i) => {
            const Icon = (s.icon && INFRA_ICONS[s.icon]) ? INFRA_ICONS[s.icon] : INFRA_ICONS.duckdb;
            return (
              <Fragment key={s.id}>
                  <li className="flex shrink-0 flex-col items-center gap-2.5">
                    <div className="panel-raised flex h-[74px] w-[86px] flex-col items-center justify-center gap-2 !rounded-xl">
                      <Icon className="h-7 w-7 text-ink" aria-hidden />
                      <span className="text-xs font-medium text-ink">{s.name}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
                      <span className={cn('h-2.5 w-2.5 rounded-full', HEALTH_DOT[s.status])} aria-hidden />
                      {HEALTH_LABEL[s.status]}
                    </span>
                  </li>
                  {i < services.length - 1 &&
                <li aria-hidden className="flex h-[74px] shrink-0 items-center">
                      <ArrowRightIcon className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
                    </li>
                }
                </Fragment>);

          })}
          </ol>
        }
      </QueryState>
    </Panel>);

}