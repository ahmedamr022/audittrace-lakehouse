import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function ConfidenceGauge({ value, label = 'Detection Confidence' }: {value: number;label?: string;}) {
  const reduce = useReducedMotion();
  const size = 136;
  const stroke = 10;
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${clamped}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[120deg]">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="45%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r + 6} fill="none" stroke="#f0f9ff" strokeWidth={1} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0f2fe" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - clamped / 100) : c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} />
        
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tabular text-[24px] font-semibold leading-none text-ink">{clamped.toFixed(1)}%</span>
        <span className="mt-1.5 max-w-[78px] text-[10.5px] leading-tight text-ink-muted">{label}</span>
      </div>
    </div>);

}