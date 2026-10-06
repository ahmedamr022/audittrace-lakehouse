import React, { useState } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useLakehouseTables } from '../hooks/useOperationsQueries';
import { lakehouseApi } from '../utils/lakehouseClient';
import { formatBytes, formatCompact, formatRelative } from '../utils/format';
import { HEALTH_DOT, HEALTH_LABEL } from '../utils/statusStyles';
import { cn } from '../utils/cn';
import { StreamControl } from '../components/layout/StreamControl';
import { PageTitle } from '../components/ui/PageTitle';
import { QueryState } from '../components/ui/QueryState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { PipelineHealth } from '../components/dashboard/PipelineHealth';
import { LocalInfrastructure } from '../components/dashboard/LocalInfrastructure';
import type { LakehouseLayer, LakehouseTable } from '../types/operations';

type LayerFilter = LakehouseLayer | 'all';

const LAYER_BADGE: Record<LakehouseLayer, string> = {
  bronze: 'bg-amber-50 text-amber-700 ring-amber-200',
  silver: 'bg-slate-50 text-slate-600 ring-slate-200',
  gold: 'bg-yellow-50 text-yellow-700 ring-yellow-200'
};

export function Lakehouse() {
  const query = useLakehouseTables();
  const [layer, setLayer] = useState<LayerFilter>('all');
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());

  const refresh = async (t: LakehouseTable) => {
    setRefreshing((s) => new Set(s).add(t.id));
    try {
      const updated = await lakehouseApi.refreshLakehouseTable(t.id);
      query.mutate((prev) => prev?.map((x) => x.id === t.id ? updated : x) ?? prev);
      toast.success(`${t.name} refreshed`);
    } catch (e) {
      toast.error(`Could not refresh ${t.name}`, { description: e instanceof Error ? e.message : undefined });
    } finally {
      setRefreshing((s) => {
        const n = new Set(s);
        n.delete(t.id);
        return n;
      });
    }
  };

  const count = (l: LakehouseLayer) => query.data?.filter((t) => t.layer === l).length;

  return (
    <>
      <PageTitle title="Data Lakehouse" subtitle="Medallion tables feeding every fraud signal, with freshness and quality." actions={<StreamControl />} />

      <div className="mt-4 grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
        <section className="panel p-4" aria-labelledby="tables-title">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="tables-title" className="text-[15px] font-semibold text-ink">
              Tables
            </h2>
            <SegmentedControl<LayerFilter>
              label="Layer"
              value={layer}
              onChange={setLayer}
              options={[
              { value: 'all', label: 'All', count: query.data?.length },
              { value: 'bronze', label: 'Bronze', count: count('bronze') },
              { value: 'silver', label: 'Silver', count: count('silver') },
              { value: 'gold', label: 'Gold', count: count('gold') }]
              } />
            
          </header>
          <QueryState
            query={query}
            skeleton={
            <div className="space-y-2.5">
                {Array.from({ length: 7 }, (_, i) =>
              <Skeleton key={i} className="h-10 w-full" />
              )}
              </div>
            }>
            
            {(tables) =>
            <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="text-[11px] text-ink-muted">
                      {['Table', 'Layer', 'Rows', 'Size', 'Freshness', 'Quality', 'Status', ''].map((c, i) =>
                    <th key={i} scope="col" className="px-3 pb-2 font-medium">
                          {c}
                        </th>
                    )}
                    </tr>
                  </thead>
                  <tbody>
                    {tables.
                  filter((t) => layer === 'all' || t.layer === layer).
                  map((t) =>
                  <tr key={t.id} className="border-t border-line/70">
                          <td className="px-3 py-3 font-mono text-[12px] text-ink">{t.name}</td>
                          <td className="px-3 py-3">
                            <span className={cn('rounded-full px-2 py-0.5 text-[10.5px] font-medium capitalize ring-1', LAYER_BADGE[t.layer])}>{t.layer}</span>
                          </td>
                          <td className="tabular px-3 py-3 text-xs text-ink">{formatCompact(t.rowCount)}</td>
                          <td className="tabular px-3 py-3 text-xs text-ink">{formatBytes(t.sizeBytes)}</td>
                          <td className="px-3 py-3 text-xs text-ink-muted">{formatRelative(t.lastUpdated)}</td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-2">
                              <span className="h-1.5 w-14 overflow-hidden rounded-full bg-brand-50">
                                <span className="brand-bar block h-full rounded-full" style={{ width: `${t.qualityScore}%` }} />
                              </span>
                              <span className="tabular text-xs text-ink">{t.qualityScore}%</span>
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-1.5 text-xs text-ink">
                              <span className={cn('h-2 w-2 rounded-full', HEALTH_DOT[t.status])} aria-hidden />
                              {HEALTH_LABEL[t.status]}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                        type="button"
                        onClick={() => refresh(t)}
                        disabled={refreshing.has(t.id)}
                        aria-label={`Refresh ${t.name}`}
                        className="icon-soft inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:text-brand-900 disabled:opacity-60">
                        
                              <RefreshCwIcon className={cn('h-3.5 w-3.5', refreshing.has(t.id) && 'animate-spin')} aria-hidden />
                            </button>
                          </td>
                        </tr>
                  )}
                  </tbody>
                </table>
              </div>
            }
          </QueryState>
        </section>

        <PipelineHealth />
      </div>

      <div className="mt-3.5">
        <LocalInfrastructure />
      </div>
    </>);

}