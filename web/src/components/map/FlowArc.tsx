import React from 'react';
import { useMapContext } from 'react-simple-maps';
import { useReducedMotion } from 'framer-motion';

interface FlowArcProps {
  from: [number, number];
  to: [number, number];
  color: string;
  markerId: string;
  index: number;
  /** 0–1 relative volume → stroke weight */
  weight: number;
  dimmed: boolean;
  scale: number;
}

/** Curved transaction flow between two [lng, lat] points with a packet travelling along it. */
export function FlowArc({ from, to, color, markerId, index, weight, dimmed, scale }: FlowArcProps) {
  const { projection } = useMapContext();
  const reduce = useReducedMotion();
  const a = projection(from);
  const b = projection(to);
  if (!a || !b) return null;

  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  let nx = -dy / dist;
  let ny = dx / dist;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const bow = Math.min(dist * 0.3, 95);
  const cx = (x1 + x2) / 2 + nx * bow;
  const cy = (y1 + y2) / 2 + ny * bow;
  const d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
  const width = 0.9 + weight * 1.6;
  const dur = `${2.4 + index % 5 * 0.45}s`;

  return (
    <g pointerEvents="none" opacity={dimmed ? 0.18 : 1} style={{ transition: 'opacity 200ms ease-out' }}>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={width + 3} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={width} vectorEffect="non-scaling-stroke" markerEnd={`url(#${markerId})`} />
      {!reduce &&
      <circle r={2.6 * scale} fill="#ffffff" stroke={color} strokeWidth={1.4} vectorEffect="non-scaling-stroke">
          <animateMotion dur={dur} repeatCount="indefinite" path={d} begin={`${index % 4 * 0.5}s`} />
        </circle>
      }
    </g>);

}