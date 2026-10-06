import React, { useState } from 'react';
import { CheckIcon, CopyIcon, DatabaseIcon, PlugZapIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiDocs } from '../data/apiDocs';
import type { ApiDoc } from '../data/apiDocs';
import { lakehouseConfig } from '../utils/lakehouseConfig';
import { cn } from '../utils/cn';
import { PageTitle } from '../components/ui/PageTitle';

const METHOD_STYLE: Record<ApiDoc['method'], string> = {
  GET: 'bg-brand-50 text-brand-700 ring-brand-200',
  POST: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PATCH: 'bg-amber-50 text-amber-700 ring-amber-200',
  PUT: 'bg-violet-50 text-violet-700 ring-violet-200',
  DELETE: 'bg-rose-50 text-rose-600 ring-rose-200'
};

const STEPS = [
{ title: 'Open utils/lakehouseConfig.ts', text: 'This is the only file you edit to go live.' },
{ title: "Set mode to 'rest'", text: 'Add your baseUrl and apiKey (sent as a Bearer token).' },
{ title: 'Expose the endpoints below', text: 'Each must return JSON matching types/dashboard.ts and types/operations.ts.' }];


export function Docs() {
  const [copied, setCopied] = useState<string | null>(null);
  const live = lakehouseConfig.mode === 'rest';

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(`${lakehouseConfig.baseUrl}${path}`);
      setCopied(path);
      window.setTimeout(() => setCopied((c) => c === path ? null : c), 1500);
    } catch {
      toast.error('Clipboard unavailable in this browser');
    }
  };

  return (
    <>
      <PageTitle title="Integration Docs" subtitle="How this app connects to your lakehouse, and every endpoint it calls." />

      <div className="mt-4 grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]">
        <div className="flex flex-col gap-3.5">
          <section className={cn('rounded-[1.25rem] p-5 text-white', live ? 'alert-navy' : 'alert-navy')} aria-label="Connection status">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                {live ? <PlugZapIcon className="h-5 w-5 text-brand-200" aria-hidden /> : <DatabaseIcon className="h-5 w-5 text-brand-200" aria-hidden />}
              </span>
              <div>
                <p className="text-sm font-semibold">{live ? 'Connected to lakehouse' : 'Running on sample data'}</p>
                <p className="text-xs text-brand-100/80">Mode: {lakehouseConfig.mode}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-brand-100/70">Base URL</dt>
                <dd className="truncate font-mono">{lakehouseConfig.baseUrl || '— not set —'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brand-100/70">Auth</dt>
                <dd>{lakehouseConfig.apiKey ? 'Bearer token' : 'Cookie / proxy'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brand-100/70">Timeout</dt>
                <dd className="tabular">{lakehouseConfig.timeoutMs / 1000}s</dd>
              </div>
            </dl>
          </section>

          <section className="panel p-5" aria-labelledby="steps-title">
            <h2 id="steps-title" className="text-[15px] font-semibold text-ink">
              Go live in three steps
            </h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((s, i) =>
              <li key={s.title} className="flex gap-3">
                  <span className="icon-3d tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">{i + 1}</span>
                  <div>
                    <p className="text-[13px] font-medium text-ink">{s.title}</p>
                    <p className="text-xs text-ink-muted">{s.text}</p>
                  </div>
                </li>
              )}
            </ol>
          </section>
        </div>

        <section className="panel p-4" aria-labelledby="endpoints-title">
          <h2 id="endpoints-title" className="mb-3 text-[15px] font-semibold text-ink">
            Endpoints <span className="tabular ml-1 text-xs font-normal text-ink-soft">{apiDocs.length}</span>
          </h2>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="text-[11px] text-ink-muted">
                  <th scope="col" className="px-2 pb-2 font-medium">Method</th>
                  <th scope="col" className="px-2 pb-2 font-medium">Path</th>
                  <th scope="col" className="px-2 pb-2 font-medium">Returns</th>
                  <th scope="col" className="px-2 pb-2 font-medium">Used by</th>
                  <th scope="col" className="px-2 pb-2"><span className="sr-only">Copy</span></th>
                </tr>
              </thead>
              <tbody>
                {apiDocs.map((d) =>
                <tr key={`${d.method}${d.path}`} className="border-t border-line/70">
                    <td className="px-2 py-2.5">
                      <span className={cn('inline-block w-[58px] rounded-md py-0.5 text-center text-[10.5px] font-semibold ring-1', METHOD_STYLE[d.method])}>{d.method}</span>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-[11.5px] text-ink">{d.path}</td>
                    <td className="px-2 py-2.5 font-mono text-[11.5px] text-brand-700">{d.returns}</td>
                    <td className="px-2 py-2.5 text-xs text-ink-muted">{d.usedBy}</td>
                    <td className="px-2 py-2.5 text-right">
                      <button type="button" aria-label={`Copy ${d.path}`} onClick={() => copy(d.path)} className="icon-soft inline-flex h-7 w-7 items-center justify-center rounded-lg">
                        {copied === d.path ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : <CopyIcon className="h-3.5 w-3.5" aria-hidden />}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>);

}