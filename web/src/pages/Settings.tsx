import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStream } from '../contexts/StreamContext';
import { useCurrentUser } from '../hooks/useDashboardQueries';
import { useSettings } from '../hooks/useOperationsQueries';
import { lakehouseApi } from '../utils/lakehouseClient';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { PageTitle } from '../components/ui/PageTitle';
import { QueryState } from '../components/ui/QueryState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { Toggle } from '../components/ui/Toggle';
import type { Severity, TimeRange } from '../types/dashboard';
import type { AppSettings } from '../types/operations';

function Row({ title, hint, children }: {title: string;hint: string;children: React.ReactNode;}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="max-w-md">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-muted">{hint}</p>
      </div>
      {children}
    </div>);

}

export function Settings() {
  const query = useSettings();
  const user = useCurrentUser();
  const { setIsLive } = useStream();
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (query.data && !draft) setDraft(query.data);
  }, [query.data, draft]);

  const dirty = !!draft && !!query.data && JSON.stringify(draft) !== JSON.stringify(query.data);
  const thresholdError = draft && draft.reviewThreshold >= draft.declineThreshold ? 'Review threshold must be lower than decline threshold.' : null;
  const set = <K extends keyof AppSettings,>(key: K, value: AppSettings[K]) => setDraft((d) => d ? { ...d, [key]: value } : d);

  const save = async () => {
    if (!draft || thresholdError) return;
    setSaving(true);
    try {
      const saved = await lakehouseApi.updateSettings(draft);
      query.mutate(() => saved);
      setDraft(saved);
      setIsLive(saved.liveOnLoad);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Could not save settings', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Settings"
        subtitle="Decision thresholds, alert routing and display preferences."
        actions={
        <>
            <Button disabled={!dirty || saving} onClick={() => query.data && setDraft(query.data)}>
              Discard
            </Button>
            <Button variant="primary" disabled={!dirty || !!thresholdError} loading={saving} onClick={save}>
              Save changes
            </Button>
          </>
        } />
      

      <QueryState query={query} skeleton={<Skeleton className="mt-4 h-[480px] rounded-2xl" />}>
        {() =>
        draft &&
        <div className="mt-4 grid gap-3.5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="flex flex-col gap-3.5">
                <section className="panel px-5 py-1" aria-labelledby="s-decisions">
                  <h2 id="s-decisions" className="pt-4 text-[15px] font-semibold text-ink">
                    Decision thresholds
                  </h2>
                  <div className="divide-y divide-line">
                    {(
                [
                ['reviewThreshold', 'Send to review at', 'Transactions at or above this risk score are queued for analysts.'],
                ['declineThreshold', 'Auto-decline at', 'Transactions at or above this score are blocked in real time.']] as
                const).
                map(([key, title, hint]) =>
                <Row key={key} title={title} hint={hint}>
                        <div className="flex w-64 items-center gap-3">
                          <input type="range" min={5} max={99} value={draft[key]} onChange={(e) => set(key, Number(e.target.value))} aria-label={title} className="flex-1 accent-brand-500" />
                          <span className="tabular inset-well w-12 rounded-lg border border-line py-1 text-center text-sm font-semibold text-ink">{draft[key]}</span>
                        </div>
                      </Row>
                )}
                  </div>
                  {thresholdError && <p className="pb-4 text-xs font-medium text-rose-600">{thresholdError}</p>}
                </section>

                <section className="panel px-5 py-1" aria-labelledby="s-alerts">
                  <h2 id="s-alerts" className="pt-4 text-[15px] font-semibold text-ink">
                    Alert routing
                  </h2>
                  <div className="divide-y divide-line">
                    <Row title="Minimum severity" hint="Only alerts at this level or higher are sent to channels.">
                      <SegmentedControl<Severity>
                    label="Minimum severity"
                    value={draft.alertMinSeverity}
                    onChange={(v) => set('alertMinSeverity', v)}
                    options={(['Low', 'Medium', 'High', 'Critical'] as const).map((s) => ({ value: s, label: s }))} />
                  
                    </Row>
                    <Row title="Email" hint="Digest and critical alerts to the fraud team inbox.">
                      <Toggle checked={draft.emailAlerts} onChange={(v) => set('emailAlerts', v)} label="Email alerts" />
                    </Row>
                    <Row title="Slack" hint="Post alerts to #fraud-ops in real time.">
                      <Toggle checked={draft.slackAlerts} onChange={(v) => set('slackAlerts', v)} label="Slack alerts" />
                    </Row>
                    <Row title="SMS" hint="Page the on-call analyst for critical alerts only.">
                      <Toggle checked={draft.smsAlerts} onChange={(v) => set('smsAlerts', v)} label="SMS alerts" />
                    </Row>
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-3.5">
                <section className="panel p-5" aria-labelledby="s-profile">
                  <h2 id="s-profile" className="text-[15px] font-semibold text-ink">
                    Profile
                  </h2>
                  {user.data ?
              <div className="mt-4 flex items-center gap-3">
                      <img src={user.data.avatarUrl} alt="" className="h-14 w-14 rounded-2xl object-cover shadow-[0_6px_14px_-6px_rgba(12,74,110,0.5)]" />
                      <div>
                        <p className="text-sm font-semibold text-ink">{user.data.name}</p>
                        <p className="text-xs text-ink-muted">{user.data.role}</p>
                      </div>
                    </div> :

              <Skeleton className="mt-4 h-14 w-full" />
              }
                </section>

                <section className="panel px-5 py-1" aria-labelledby="s-display">
                  <h2 id="s-display" className="pt-4 text-[15px] font-semibold text-ink">
                    Display
                  </h2>
                  <div className="divide-y divide-line">
                    <Row title="Live stream on load" hint="Start with auto-refresh on.">
                      <Toggle checked={draft.liveOnLoad} onChange={(v) => set('liveOnLoad', v)} label="Live stream on load" />
                    </Row>
                    <div className="py-4">
                      <p className="text-[13px] font-medium text-ink">Default time range</p>
                      <p className="mb-3 text-xs text-ink-muted">Used by the activity chart.</p>
                      <SegmentedControl<TimeRange>
                    label="Default time range"
                    value={draft.defaultRange}
                    onChange={(v) => set('defaultRange', v)}
                    options={(['1H', '6H', '24H', '7D'] as const).map((r) => ({ value: r, label: r }))} />
                  
                    </div>
                  </div>
                </section>
                <p className={cn('px-1 text-xs', dirty ? 'text-amber-600' : 'text-ink-soft')}>{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
              </div>
            </div>

        }
      </QueryState>
    </>);

}