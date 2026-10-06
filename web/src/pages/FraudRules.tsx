import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { mockPatternDetails } from '../data/operationsMock';
import { useFraudRules } from '../hooks/useOperationsQueries';
import { lakehouseApi } from '../utils/lakehouseClient';
import { formatRelative } from '../utils/format';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PageTitle } from '../components/ui/PageTitle';
import { QueryState } from '../components/ui/QueryState';
import { Skeleton } from '../components/ui/Skeleton';
import { Toggle } from '../components/ui/Toggle';
import { RuleForm } from '../components/rules/RuleForm';
import type { FraudRule, NewFraudRule } from '../types/operations';

const patternName = (id: string) => mockPatternDetails.find((p) => p.id === id)?.name ?? id;

export function FraudRules() {
  const query = useFraudRules();
  const [params, setParams] = useSearchParams();
  const patternFilter = params.get('pattern');
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<FraudRule | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = async (rule: FraudRule, change: Partial<FraudRule>, message: string) => {
    query.mutate((prev) => prev?.map((r) => r.id === rule.id ? { ...r, ...change } : r) ?? prev);
    try {
      await lakehouseApi.updateFraudRule(rule.id, change);
      toast.success(message);
    } catch (e) {
      query.mutate((prev) => prev?.map((r) => r.id === rule.id ? rule : r) ?? prev);
      toast.error('Could not update rule', { description: e instanceof Error ? e.message : undefined });
    }
  };

  const create = async (input: NewFraudRule) => {
    setBusy(true);
    try {
      const rule = await lakehouseApi.createFraudRule(input);
      query.mutate((prev) => [rule, ...(prev ?? [])]);
      setCreateOpen(false);
      toast.success(`Rule “${rule.name}” created`);
    } catch (e) {
      toast.error('Could not create rule', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await lakehouseApi.deleteFraudRule(toDelete.id);
      query.mutate((prev) => prev?.filter((r) => r.id !== toDelete.id) ?? prev);
      toast.success(`Rule “${toDelete.name}” deleted`);
      setToDelete(null);
    } catch (e) {
      toast.error('Could not delete rule', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const enabledCount = query.data?.filter((r) => r.enabled).length ?? 0;

  return (
    <>
      <PageTitle
        title="Fraud Rules"
        subtitle={query.data ? `${enabledCount} of ${query.data.length} rules active · changes apply to new transactions instantly` : 'Detection rules applied to every transaction.'}
        actions={
        <Button variant="primary" icon={<PlusIcon className="h-4 w-4" aria-hidden />} onClick={() => setCreateOpen(true)}>
            New rule
          </Button>
        } />
      

      {patternFilter &&
      <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
          Filtered by pattern
          <button
          type="button"
          onClick={() => setParams({}, { replace: true })}
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">
          
            {patternName(patternFilter)} <XIcon className="h-3 w-3" aria-hidden />
          </button>
        </div>
      }

      <section className="panel mt-4 p-2" aria-label="Rules">
        <QueryState
          query={query}
          isEmpty={(d) => d.length === 0}
          emptyMessage="No rules yet. Create your first rule."
          skeleton={
          <div className="space-y-2 p-2">
              {Array.from({ length: 5 }, (_, i) =>
            <Skeleton key={i} className="h-16 w-full" />
            )}
            </div>
          }>
          
          {(rules) =>
          <ul className="divide-y divide-line">
              {rules.
            filter((r) => !patternFilter || r.pattern === patternFilter).
            map((r) =>
            <li key={r.id} className={cn('grid grid-cols-1 items-center gap-4 px-3 py-4 lg:grid-cols-[auto_minmax(0,1fr)_200px_150px_90px_auto]', !r.enabled && 'opacity-70')}>
                    <Toggle checked={r.enabled} label={`Enable ${r.name}`} onChange={(v) => patch(r, { enabled: v }, `${r.name} ${v ? 'enabled' : 'disabled'}`)} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                        {r.name}
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-medium text-brand-700 ring-1 ring-brand-200">{patternName(r.pattern)}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">{r.description}</p>
                      <p className="mt-1 text-[11px] text-ink-soft">Updated {formatRelative(r.updatedAt)}</p>
                    </div>
                    <label className="block">
                      <span className="flex items-center justify-between text-[11px] text-ink-muted">
                        Fires at risk score <span className="tabular font-semibold text-ink">{r.threshold}</span>
                      </span>
                      <input
                  type="range"
                  min={10}
                  max={99}
                  defaultValue={r.threshold}
                  aria-label={`${r.name} threshold`}
                  onMouseUp={(e) => patch(r, { threshold: Number(e.currentTarget.value) }, `Threshold set to ${e.currentTarget.value}`)}
                  onKeyUp={(e) => patch(r, { threshold: Number(e.currentTarget.value) }, `Threshold set to ${e.currentTarget.value}`)}
                  onTouchEnd={(e) => patch(r, { threshold: Number(e.currentTarget.value) }, `Threshold set to ${e.currentTarget.value}`)}
                  className="mt-1.5 w-full accent-brand-500" />
                
                    </label>
                    <div className="inset-well flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label={`${r.name} action`}>
                      {(['Review', 'Decline'] as const).map((a) =>
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={r.action === a}
                  onClick={() => r.action !== a && patch(r, { action: a }, `${r.name} now sends to ${a}`)}
                  className={cn('h-7 flex-1 rounded-md text-xs font-medium transition-colors duration-150', r.action === a ? a === 'Decline' ? 'bg-rose-500 text-white shadow-sm' : 'brand-chip text-white' : 'text-ink-muted hover:text-ink')}>
                  
                          {a}
                        </button>
                )}
                    </div>
                    <div className="text-right lg:text-left">
                      <p className="tabular text-sm font-semibold text-ink">{r.hits24h.toLocaleString('en-US')}</p>
                      <p className="text-[11px] text-ink-soft">hits / 24h</p>
                    </div>
                    <button
                type="button"
                aria-label={`Delete ${r.name}`}
                onClick={() => setToDelete(r)}
                className="flex h-9 w-9 items-center justify-center justify-self-end rounded-lg text-ink-soft transition-colors duration-150 hover:bg-rose-50 hover:text-rose-600">
                
                      <Trash2Icon className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
            )}
            </ul>
          }
        </QueryState>
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New fraud rule" description="Rules run on every incoming transaction." width="max-w-lg">
        <RuleForm submitting={busy} onCancel={() => setCreateOpen(false)} onSubmit={create} defaultPattern={patternFilter ?? undefined} />
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete rule?"
        description={toDelete ? `“${toDelete.name}” will stop evaluating transactions immediately.` : undefined}
        footer={
        <>
            <Button onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Delete rule
            </Button>
          </>
        }>
        
        <p className="text-xs text-ink-muted">Historical hits remain in the lakehouse for auditing.</p>
      </Modal>
    </>);

}