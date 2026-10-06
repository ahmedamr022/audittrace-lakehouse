import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRightIcon, ArrowUpRightIcon, ShieldCheckIcon } from 'lucide-react';
import { useFraudPatternDetails } from '../hooks/useOperationsQueries';
import { formatDelta, formatPercent } from '../utils/format';
import { COLORS } from '../utils/statusStyles';
import { cn } from '../utils/cn';
import { StreamControl } from '../components/layout/StreamControl';
import { PageTitle } from '../components/ui/PageTitle';
import { QueryState } from '../components/ui/QueryState';
import { Skeleton } from '../components/ui/Skeleton';
import { Sparkline } from '../components/ui/Sparkline';

const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

export function FraudPatterns() {
  const query = useFraudPatternDetails();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <PageTitle title="Fraud Patterns" subtitle="What fraud looks like right now, and how each pattern is trending." actions={<StreamControl />} />

      <QueryState
        query={query}
        isEmpty={(d) => d.length === 0}
        skeleton={
        <div className="mt-4 grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <Skeleton className="h-[420px] rounded-2xl" />
            <Skeleton className="h-[420px] rounded-2xl" />
          </div>
        }>
        
        {(patterns) => {
          const selected = patterns.find((p) => p.id === selectedId) ?? patterns[0];
          const chart = selected.trend.map((v, i) => ({ week: WEEKS[i] ?? `W${i + 1}`, cases: v }));
          const up = selected.changePercent >= 0;
          return (
            <div className="mt-4 grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <section className="panel p-2" aria-label="Patterns">
                <ol className="space-y-1">
                  {patterns.map((p, i) => {
                    const active = p.id === selected.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedId(p.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                            active ? 'panel-raised' : 'hover:bg-brand-50/60'
                          )}>
                          
                          <span className={cn('tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold', active ? 'icon-3d' : 'border border-line bg-white text-ink')}>
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                            <span className="tabular block text-[11px] text-ink-muted">
                              {(p.cases ?? 0).toLocaleString('en-US')} cases · {formatPercent(p.percent ?? 0)}
                            </span>
                          </span>
                          <Sparkline values={p.trend ?? [10, 15, 20, 25, 30]} width={72} height={28} />
                          <span className={cn('tabular w-14 text-right text-xs font-semibold', (p.changePercent ?? 0) >= 0 ? 'text-rose-500' : 'text-brand-600')}>{formatDelta(p.changePercent ?? 0)}</span>
                        </button>
                      </li>);

                  })}
                </ol>
              </section>

              <section className="panel flex flex-col p-5" aria-labelledby="pattern-detail">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <h2 id="pattern-detail" className="text-xl font-semibold text-ink">
                      {selected.name}
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted">{selected.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-3xl font-semibold tracking-tight text-ink">{(selected.cases ?? 0).toLocaleString('en-US')}</p>
                    <p className={cn('mt-1 inline-flex items-center gap-1 text-xs font-semibold', up ? 'text-rose-500' : 'text-brand-600')}>
                      {up ? <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRightIcon className="h-3.5 w-3.5" aria-hidden />}
                      {formatDelta(selected.changePercent ?? 0)} vs last period
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pattern-fill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={COLORS.brand400} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={COLORS.brand400} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: COLORS.inkSoft }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${COLORS.line}`, fontSize: 12 }} />
                      <Area type="monotone" dataKey="cases" stroke={COLORS.brand600} strokeWidth={2.2} fill="url(#pattern-fill)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-ink-muted">Most affected</span>
                    {(selected.topRegions ?? []).map((r) =>
                    <Link key={r} to={`/transactions?region=${r}`} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200 transition-colors duration-150 hover:bg-brand-100">
                        {r}
                      </Link>
                    )}
                  </div>
                  <Link
                    to={`/fraud-rules?pattern=${selected.id}`}
                    className="btn-primary inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-white transition-[filter] duration-150 hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
                    
                    <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden />
                    Manage rules for this pattern
                  </Link>
                </div>
              </section>
            </div>);

        }}
      </QueryState>
    </>);

}