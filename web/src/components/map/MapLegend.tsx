import React from 'react';
import { COUNTRY_RISK_SCALE, REGION_STATUS_COLOR, REGION_STATUS_LABEL } from '../../utils/statusStyles';
import type { RegionStatus } from '../../types/dashboard';

const STATUSES: RegionStatus[] = ['normal', 'review', 'suspicious'];

export function MapLegend({ showScale = true }: {showScale?: boolean;}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <ul className="flex items-center gap-5" aria-label="Region status">
        {STATUSES.map((s) =>
        <li key={s} className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: REGION_STATUS_COLOR[s] }} aria-hidden />
            {REGION_STATUS_LABEL[s]}
          </li>
        )}
      </ul>
      {showScale &&
      <div className="flex items-center gap-2 text-[11px] text-ink-muted">
          <span>Country risk</span>
          <span className="flex overflow-hidden rounded-full ring-1 ring-line" aria-hidden>
            {COUNTRY_RISK_SCALE.map((s) =>
          <span key={s.label} className="h-2 w-6" style={{ backgroundColor: s.color }} title={s.label} />
          )}
          </span>
          <span>High</span>
        </div>
      }
    </div>);

}