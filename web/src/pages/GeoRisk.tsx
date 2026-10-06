import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, XIcon } from 'lucide-react';
import { useRiskMap } from '../hooks/useDashboardQueries';
import { formatClock, formatCompact } from '../utils/format';
import { countryRiskFill, REGION_STATUS_COLOR, REGION_STATUS_LABEL } from '../utils/statusStyles';
import { cn } from '../utils/cn';
import { StreamControl } from '../components/layout/StreamControl';
import { MapLegend } from '../components/map/MapLegend';
import { WorldRiskMap } from '../components/map/WorldRiskMap';
import { PageTitle } from '../components/ui/PageTitle';
import { QueryState } from '../components/ui/QueryState';
import { Skeleton } from '../components/ui/Skeleton';

export function GeoRisk() {
  const query = useRiskMap();
  const [params, setParams] = useSearchParams();
  const regionParam = params.get('region');
  const countryParam = params.get('country');

  const selectedCountry = useMemo(
    () => query.data?.countries.find((c) => c.name.toLowerCase() === countryParam?.toLowerCase() || c.iso2 === countryParam) ?? null,
    [query.data, countryParam]
  );
  const selectedRegionId = selectedCountry?.regionId ?? regionParam;

  const select = (next: {region?: string | null;country?: string | null;}) => {
    const p = new URLSearchParams();
    if (next.region) p.set('region', next.region);
    if (next.country) p.set('country', next.country);
    setParams(p, { replace: true });
  };

  return (
    <>
      <PageTitle title="Geo Risk" subtitle="Country-level risk and cross-border transaction flows, updated live." actions={<StreamControl />} />

      <QueryState
        query={query}
        skeleton={
        <div className="mt-4 grid gap-3.5 xl:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)]">
            <Skeleton className="h-[460px] rounded-2xl" />
            <Skeleton className="h-[460px] rounded-2xl" />
          </div>
        }>
        
        {(data) => {
          const regions = [...data.regions].sort((a, b) => b.highRiskCount - a.highRiskCount);
          const activeRegion = data.regions.find((r) => r.id === selectedRegionId) ?? null;
          const countries = data.countries.filter((c) => !activeRegion || c.regionId === activeRegion.id).sort((a, b) => b.riskScore - a.riskScore);

          return (
            <div className="mt-4 grid gap-3.5 xl:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)]">
              <section className="panel overflow-hidden" aria-labelledby="geo-map-title">
                <header className="flex flex-wrap items-center justify-between gap-3 p-4 pb-2">
                  <div>
                    <h2 id="geo-map-title" className="text-[15px] font-semibold text-ink">
                      World risk map
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-soft">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500 motion-reduce:animate-none" aria-hidden />
                      {data.highRiskEvents} high-risk events · snapshot {formatClock(data.updatedAt)} · drag to pan, scroll to zoom
                    </p>
                  </div>
                  {(activeRegion || selectedCountry) &&
                  <button type="button" onClick={() => select({})} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">
                      {selectedCountry?.name ?? activeRegion?.name} <XIcon className="h-3 w-3" aria-hidden />
                    </button>
                  }
                </header>
                <div className="map-ocean">
                  <WorldRiskMap
                    data={data}
                    height={420}
                    center={[12, 18]}
                    zoomable
                    selectedRegionId={selectedRegionId}
                    selectedCountryId={selectedCountry?.id ?? null}
                    onRegionClick={(id) => select({ region: id === selectedRegionId ? null : id })}
                    onCountryClick={(c) => select({ country: c.id === selectedCountry?.id ? null : c.name })} />
                  
                </div>
                <div className="border-t border-line px-4 py-3">
                  <MapLegend />
                </div>
              </section>

              <aside className="flex min-w-0 flex-col gap-3.5">
                <section className="panel p-2" aria-label="Regions">
                  <h2 className="px-2 pb-1 pt-2 text-[15px] font-semibold text-ink">Regions</h2>
                  <ul>
                    {regions.map((r) =>
                    <li key={r.id}>
                        <button
                        type="button"
                        aria-pressed={r.id === selectedRegionId}
                        onClick={() => select({ region: r.id === selectedRegionId ? null : r.id })}
                        className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150', r.id === selectedRegionId ? 'panel-raised' : 'hover:bg-brand-50/60')}>
                        
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: REGION_STATUS_COLOR[r.status] }} aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium text-ink">{r.name}</span>
                            <span className="tabular block text-[11px] text-ink-muted">
                              {formatCompact(r.transactionCount)} txns · {REGION_STATUS_LABEL[r.status]}
                            </span>
                          </span>
                          <span className="tabular text-sm font-semibold text-rose-500">{r.highRiskCount}</span>
                        </button>
                      </li>
                    )}
                  </ul>
                </section>

                <section className="panel flex-1 p-4" aria-labelledby="countries-title">
                  <h2 id="countries-title" className="text-[15px] font-semibold text-ink">
                    {activeRegion ? `Countries · ${activeRegion.name}` : 'Highest-risk countries'}
                  </h2>
                  <ul className="mt-3 space-y-2.5">
                    {countries.slice(0, 7).map((c) =>
                    <li key={c.id}>
                        <button type="button" onClick={() => select({ country: c.name })} className={cn('w-full rounded-lg px-1 py-0.5 text-left', c.id === selectedCountry?.id && 'bg-brand-50')}>
                          <span className="flex items-center justify-between text-xs">
                            <span className="font-medium text-ink">{c.name}</span>
                            <span className="tabular text-ink-muted">{c.riskScore}</span>
                          </span>
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-brand-50">
                            <span className="block h-full rounded-full" style={{ width: `${c.riskScore}%`, backgroundColor: countryRiskFill(c.riskScore) === '#c4e5f8' ? '#7dd3fc' : countryRiskFill(c.riskScore) }} />
                          </span>
                        </button>
                      </li>
                    )}
                  </ul>
                  {selectedCountry &&
                  <Link to={`/transactions?region=${selectedCountry.iso2}`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900">
                      View {selectedCountry.name} transactions <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  }
                </section>
              </aside>
            </div>);

        }}
      </QueryState>
    </>);

}