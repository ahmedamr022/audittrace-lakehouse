import React, { useId } from 'react';

interface SparklineProps {
  values: number[];
  color?: string;
  colorEnd?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ values, color = '#38bdf8', colorEnd = '#0284c7', width = 104, height = 36 }: SparklineProps) {
  const id = useId().replace(/:/g, '');
  if (values.length < 2) return null;

  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
  pad + i / (values.length - 1) * (width - pad * 2),
  pad + (1 - (v - min) / span) * (height - pad * 2)]
  );
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={`sl-stroke-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={colorEnd} />
        </linearGradient>
        <linearGradient id={`sl-fill-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sl-fill-${id})`} />
      <path d={line} fill="none" stroke={`url(#sl-stroke-${id})`} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2.5} fill={colorEnd} stroke="#fff" strokeWidth={1.25} />
    </svg>);

}