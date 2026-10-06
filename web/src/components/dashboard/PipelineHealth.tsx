import React from 'react';
import { usePipelineHealth } from '../../hooks/useDashboardQueries';
import { HEALTH_DOT, HEALTH_LABEL } from '../../utils/statusStyles';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';
import { PIPELINE_ICONS } from './iconRegistry';

export function PipelineHealth({ className }: {className?: string;}) {
  const query = usePipelineHealth();

  return (
    <Panel title="Pipeline Health" labelledBy="pipeline-title" className={className} headerClassName="mb-1" to="/lakehouse" toLabel="Open data lakehouse">
      <QueryState
        query={query}
        isEmpty={(d) => d.length === 0}
        skeleton={
        <div className="space-y-4 pt-2">
            {Array.from({ length: 5 }, (_, i) =>
          <Skeleton key={i} className="h-4 w-full" />
          )}
          </div>
        }>
        
        {(metrics) =>
        <ul className="flex flex-1 flex-col justify-around divide-y divide-line">
            {metrics.map((m) => {
            const Icon = PIPELINE_ICONS[m.icon];
            return (
              <li key={m.id} className="flex items-center gap-2.5 py-2">
                  <Icon className="h-4 w-4 shrink-0 text-ink" aria-hidden />
                  <span
                  className={cn('h-2 w-2 shrink-0 rounded-full ring-2 ring-white', HEALTH_DOT[m.status])}
                  role="img"
                  aria-label={HEALTH_LABEL[m.status]} />
                
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink">{m.name}</span>
                  <span className={cn('tabular whitespace-nowrap text-[11.5px] font-medium', m.status === 'healthy' ? 'text-ink' : m.status === 'degraded' ? 'text-amber-600' : 'text-declined')}>
                    {m.value}
                  </span>
                </li>);

          })}
          </ul>
        }
      </QueryState>
    </Panel>);

}