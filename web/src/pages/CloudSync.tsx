import React, { useEffect, useRef, useState } from 'react';
import { CloudUploadIcon, LoaderCircleIcon, PlayIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useSyncJobs } from '../hooks/useOperationsQueries';
import { lakehouseApi } from '../utils/lakehouseClient';
import { formatCompact, formatRelative } from '../utils/format';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { PageTitle } from '../components/ui/PageTitle';
import { QueryState } from '../components/ui/QueryState';
import { Skeleton } from '../components/ui/Skeleton';
import { Toggle } from '../components/ui/Toggle';
import type { SyncJob, SyncStatus } from '../types/operations';

const STATUS_STYLE: Record<SyncStatus, {label: string;cls: string;}> = {
  idle: { label: 'Idle', cls: 'bg-slate-50 text-ink-muted ring-line' },
  running: { label: 'Running', cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  success: { label: 'Succeeded', cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  failed: { label: 'Failed', cls: 'bg-rose-50 text-rose-600 ring-rose-200' }
};

export function CloudSync() {
  const query = useSyncJobs();
  const prev = useRef<Map<string, SyncStatus>>(new Map());
  const [starting, setStarting] = useState<Set<string>>(new Set());

  useEffect(() => {
    query.data?.forEach((j) => {
      const before = prev.current.get(j.id);
      if (before === 'running' && j.status === 'success') toast.success(`${j.name} finished`, { description: `${formatCompact(j.rowsSynced)} rows synced in total` });
      if (before === 'running' && j.status === 'failed') toast.error(`${j.name} failed`);
      prev.current.set(j.id, j.status);
    });
  }, [query.data]);

  const run = async (job: SyncJob) => {
    setStarting((s) => new Set(s).add(job.id));
    try {
      const updated = await lakehouseApi.triggerSync(job.id);
      query.mutate((p) => p?.map((j) => j.id === job.id ? updated : j) ?? p);
      toast.info(`${job.name} started`);
    } catch (e) {
      toast.error(`Could not start ${job.name}`, { description: e instanceof Error ? e.message : undefined });
    } finally {
      setStarting((s) => {
        const n = new Set(s);
        n.delete(job.id);
        return n;
      });
    }
  };

  const setEnabled = async (job: SyncJob, enabled: boolean) => {
    query.mutate((p) => p?.map((j) => j.id === job.id ? { ...j, enabled } : j) ?? p);
    try {
      await lakehouseApi.updateSyncJob(job.id, { enabled });
      toast.success(`${job.name} schedule ${enabled ? 'resumed' : 'paused'}`);
    } catch {
      query.mutate((p) => p?.map((j) => j.id === job.id ? job : j) ?? p);
      toast.error('Could not update schedule');
    }
  };

  const runAll = () => query.data?.filter((j) => j.enabled && j.status !== 'running').forEach(run);
  const anyRunnable = query.data?.some((j) => j.enabled && j.status !== 'running') ?? false;

  return (
    <>
      <PageTitle
        title="Cloud Sync"
        subtitle="Push lakehouse data to downstream systems on a schedule or on demand."
        actions={
        <Button variant="primary" icon={<CloudUploadIcon className="h-4 w-4" aria-hidden />} disabled={!anyRunnable} onClick={runAll}>
            Sync all enabled
          </Button>
        } />
      

      <section className="panel mt-4 p-2" aria-label="Sync jobs">
        <QueryState
          query={query}
          isEmpty={(d) => d.length === 0}
          skeleton={
          <div className="space-y-2 p-2">
              {Array.from({ length: 4 }, (_, i) =>
            <Skeleton key={i} className="h-16 w-full" />
            )}
            </div>
          }>
          
          {(jobs) =>
          <ul className="divide-y divide-line">
              {jobs.map((j) => {
              const running = j.status === 'running';
              const st = STATUS_STYLE[j.status];
              return (
                <li key={j.id} className="grid grid-cols-1 items-center gap-4 px-3 py-4 md:grid-cols-[auto_minmax(0,1fr)_120px_140px_auto]">
                    <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', j.enabled ? 'icon-3d' : 'icon-soft')}>
                      <CloudUploadIcon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{j.name}</p>
                      <p className="truncate font-mono text-[11.5px] text-ink-muted">{j.destination}</p>
                      <p className="mt-0.5 text-[11px] text-ink-soft">
                        {j.schedule} · last run {j.lastRunAt ? formatRelative(j.lastRunAt) : 'never'}
                      </p>
                    </div>
                    <span className={cn('inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1', st.cls)}>
                      {running && <LoaderCircleIcon className="h-3 w-3 animate-spin" aria-hidden />}
                      {st.label}
                    </span>
                    <label className="flex items-center gap-2.5 text-xs text-ink-muted">
                      <Toggle checked={j.enabled} onChange={(v) => setEnabled(j, v)} label={`Schedule for ${j.name}`} />
                      {j.enabled ? 'Scheduled' : 'Paused'}
                    </label>
                    <Button size="sm" loading={starting.has(j.id)} disabled={running} icon={<PlayIcon className="h-3.5 w-3.5" aria-hidden />} onClick={() => run(j)}>
                      {running ? 'Syncing…' : 'Run now'}
                    </Button>
                  </li>);

            })}
            </ul>
          }
        </QueryState>
      </section>
    </>);

}