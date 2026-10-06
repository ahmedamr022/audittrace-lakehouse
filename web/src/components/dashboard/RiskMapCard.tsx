import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRightIcon, CrosshairIcon } from 'lucide-react';
import { useRiskMap } from '../../hooks/useDashboardQueries';
import { formatClock } from '../../utils/format';
import { MapLegend } from '../map/MapLegend';
import { WorldRiskMap } from '../map/WorldRiskMap';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';

export function RiskMapCard() {
  const query = useRiskMap();
  const navigate = useNavigate();

  return (
    <section aria-labelledby="map-title" className="panel relative min-w-0 overflow-hidden">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
        <div>
          <h2 id="map-title" className="text-[15px] font-semibold leading-6 text-ink">
            Global Transaction Risk Map
          </h2>
          {query.data &&
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-soft">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500 motion-reduce:animate-none" aria-hidden />
              Live snapshot · {formatClock(query.data.updatedAt)}
            </p>
          }
        </div>
        <div className="pointer-events-auto flex items-start gap-2">
          {query.data &&
          <Link
            to="/alerts"
            className="panel-raised flex items-center gap-3 !rounded-xl px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            
              <span className="icon-rose flex h-8 w-8 items-center justify-center rounded-lg">
                <CrosshairIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span>
                <span className="tabular block text-base font-semibold leading-none text-ink">{query.data.highRiskEvents.toLocaleString('en-US')}</span>
                <span className="mt-1 block text-[11px] text-ink-muted">High-risk events</span>
              </span>
            </Link>
          }
          <Link
            to="/geo-risk"
            aria-label="Open Geo Risk"
            className="icon-soft flex h-7 w-7 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            
            <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="map-ocean px-2 pb-10 pt-12">
        <QueryState query={query} skeleton={<Skeleton className="mx-2 h-[230px] rounded-xl" />}>
          {(data) => <WorldRiskMap data={data} height={300} onRegionClick={(id) => navigate(`/geo-risk?region=${id}`)} />}
        </QueryState>
      </div>

      <div className="absolute bottom-3 left-4 right-4">
        <MapLegend showScale={false} />
      </div>
    </section>);

}