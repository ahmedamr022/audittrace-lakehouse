import React, { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useActivity } from '../../hooks/useDashboardQueries';
import { formatCompact } from '../../utils/format';
import { COLORS } from '../../utils/statusStyles';
import { cn } from '../../utils/cn';
import { Panel } from '../ui/Panel';
import { QueryState } from '../ui/QueryState';
import { Skeleton } from '../ui/Skeleton';
import type { TimeRange } from '../../types/dashboard';

const RANGES: TimeRange[] = ['1H', '6H', '24H', '7D'];

const SERIES = [
{ key: 'approved', label: 'Approved', color: COLORS.brand500, dot: 'bg-brand-500' },
{ key: 'review', label: 'Review', color: COLORS.review, dot: 'bg-review' },
{ key: 'declined', label: 'Declined', color: COLORS.declined, dot: 'bg-declined' }] as
const;

export function TransactionActivity() {
  const [range, setRange] = useState<TimeRange>('24H');
  const query = useActivity(range);

  return (
    <Panel
      title="Real-Time Transaction Activity"
      labelledBy="activity-title"
      headerClassName="mb-1"
      actions={
      <div role="tablist" aria-label="Time range" className="flex rounded-lg border border-line bg-white p-0.5">
          {RANGES.map((r) =>
        <button
          key={r}
          type="button"
          role="tab"
          aria-selected={r === range}
          onClick={() => setRange(r)}
          className={cn(
            'h-7 min-w-[40px] rounded-md px-2.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
            r === range ? 'brand-chip text-white shadow-sm' : 'text-ink-muted hover:text-ink'
          )}>
          
              {r}
            </button>
        )}
        </div>
      }>
      
      <ul className="mb-2 flex items-center gap-5" aria-label="Legend">
        {SERIES.map((s) =>
        <li key={s.key} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span className={cn('h-2.5 w-2.5 rounded-full', s.dot)} aria-hidden />
            {s.label}
          </li>
        )}
      </ul>

      <QueryState query={query} skeleton={<Skeleton className="h-[200px] w-full rounded-xl" />} isEmpty={(d) => d.points.length === 0}>
        {(data) =>
        <div className={cn('h-[200px] w-full transition-opacity duration-200', query.isRefreshing && 'opacity-70')}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.points} margin={{ top: 18, right: 6, left: -12, bottom: 0 }}>
                <defs>
                  {SERIES.map((s) =>
                <linearGradient key={s.key} id={`act-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={s.key === 'approved' ? 0.32 : 0.28} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                    </linearGradient>
                )}
                </defs>
                <CartesianGrid stroke={COLORS.line} vertical horizontal strokeDasharray="0" />
                <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: COLORS.inkSoft }}
                tickLine={false}
                axisLine={false}
                interval={range === '24H' ? 2 : 'preserveStartEnd'}
                dy={6} />
              
                <YAxis
                tick={{ fontSize: 11, fill: COLORS.inkSoft }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v === 0 ? '0' : formatCompact(v)}
                tickCount={6}
                width={48} />
              
                <Tooltip content={<ActivityTooltip />} cursor={{ stroke: COLORS.brand300, strokeWidth: 1 }} />
                {data.liveLabel &&
              <ReferenceLine x={data.liveLabel} stroke={COLORS.brand600} strokeDasharray="3 3" label={<LiveNowLabel />} />
              }
                <Area type="monotone" dataKey="approved" stroke={COLORS.brand500} strokeWidth={2} fill="url(#act-approved)" isAnimationActive={false} />
                <Area type="monotone" dataKey="review" stroke={COLORS.review} strokeWidth={2} fill="url(#act-review)" isAnimationActive={false} />
                <Area type="monotone" dataKey="declined" stroke={COLORS.declined} strokeWidth={2} fill="url(#act-declined)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        }
      </QueryState>
    </Panel>);

}

function LiveNowLabel({ viewBox }: {viewBox?: {x?: number;y?: number;};}) {
  const x = viewBox?.x ?? 0;
  const y = (viewBox?.y ?? 0) - 16;
  return (
    <g>
      <rect x={x - 31} y={y - 1} width={62} height={18} rx={4} fill={COLORS.brand700} />
      <text x={x} y={y + 11.5} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="#fff" letterSpacing={0.4}>
        LIVE NOW
      </text>
    </g>);

}

interface TooltipPayload {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

function ActivityTooltip({ active, payload, label }: {active?: boolean;payload?: TooltipPayload[];label?: string;}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 shadow-float">
      <p className="mb-1 text-[11px] font-medium text-ink-soft">{label}</p>
      {SERIES.map((s) => {
        const p = payload.find((x) => x.dataKey === s.key);
        if (!p) return null;
        return (
          <p key={s.key} className="tabular flex items-center justify-between gap-4 text-xs text-ink">
            <span className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', s.dot)} aria-hidden />
              {s.label}
            </span>
            <span className="font-medium">{(p.value ?? 0).toLocaleString('en-US')}</span>
          </p>);

      })}
    </div>);

}