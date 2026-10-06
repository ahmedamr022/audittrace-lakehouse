import React from 'react';
import { Marker } from 'react-simple-maps';
import { useReducedMotion } from 'framer-motion';
import { REGION_STATUS_COLOR, REGION_STATUS_LABEL } from '../../utils/statusStyles';
import type { MapRegion } from '../../types/dashboard';

interface RegionMarkerProps {
  region: MapRegion;
  /** 0–1 relative transaction volume → marker size */
  weight: number;
  selected: boolean;
  dimmed: boolean;
  scale: number;
  onHover: (region: MapRegion | null) => void;
  onClick?: (id: string) => void;
}

const LABEL_OFFSET: Record<MapRegion['labelPosition'], {x: number;y: number;anchor: 'start' | 'middle' | 'end';}> = {
  top: { x: 0, y: -20, anchor: 'middle' },
  bottom: { x: 0, y: 26, anchor: 'middle' },
  left: { x: -16, y: 4, anchor: 'end' },
  right: { x: 16, y: 4, anchor: 'start' }
};

export function RegionMarker({ region, weight, selected, dimmed, scale, onHover, onClick }: RegionMarkerProps) {
  const reduce = useReducedMotion();
  const color = REGION_STATUS_COLOR[region.status];
  const core = 4.5 + weight * 3;
  const halo = core * (region.status === 'suspicious' ? 3.4 : region.status === 'review' ? 2.8 : 2.3);
  const label = LABEL_OFFSET[region.labelPosition];

  return (
    <Marker coordinates={region.coordinates}>
      <g
        transform={`scale(${scale})`}
        tabIndex={0}
        role="button"
        aria-label={`${region.name}: ${REGION_STATUS_LABEL[region.status]}, ${region.highRiskCount} high-risk events`}
        aria-pressed={selected}
        onMouseEnter={() => onHover(region)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(region)}
        onBlur={() => onHover(null)}
        onClick={() => onClick?.(region.id)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.(region.id)}
        opacity={dimmed ? 0.35 : 1}
        style={{ cursor: onClick ? 'pointer' : 'default', outline: 'none', transition: 'opacity 200ms ease-out' }}>
        
        <circle r={halo} fill={color} fillOpacity={0.12} />
        <circle r={halo * 0.55} fill={color} fillOpacity={0.18} />
        {!reduce && region.status !== 'normal' &&
        <circle r={core} fill="none" stroke={color} strokeWidth={1.4}>
            <animate attributeName="r" from={String(core)} to={String(halo + 4)} dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" from="0.8" to="0" dur="2.4s" repeatCount="indefinite" />
          </circle>
        }
        {selected && <circle r={core + 5} fill="none" stroke="#0369a1" strokeWidth={1.6} strokeDasharray="3 2.5" />}
        <circle r={core + 1.5} fill="#ffffff" />
        <circle r={core} fill={color} />
        <circle r={core * 0.38} cx={-core * 0.25} cy={-core * 0.3} fill="#ffffff" fillOpacity={0.55} />

        {region.showLabel &&
        <text
          x={label.x}
          y={label.y}
          textAnchor={label.anchor}
          fontSize={11.5}
          fontWeight={600}
          fill="#0b2540"
          stroke="#ffffff"
          strokeWidth={3.5}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}>
          
            {region.name}
          </text>
        }
      </g>
    </Marker>);

}