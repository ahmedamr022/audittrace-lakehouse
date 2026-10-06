import React, { useMemo, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Graticule, ZoomableGroup } from 'react-simple-maps';
import { AnimatePresence, motion } from 'framer-motion';
import { MinusIcon, PlusIcon, RotateCcwIcon } from 'lucide-react';
import { countryRiskFill, REGION_STATUS_COLOR, REGION_STATUS_LABEL } from '../../utils/statusStyles';
import { formatCompact } from '../../utils/format';
import { FlowArc } from './FlowArc';
import { RegionMarker } from './RegionMarker';
import type { CountryRisk, MapRegion, RegionStatus, RiskMapData } from '../../types/dashboard';

/** Real world geometry (Natural Earth 110m via world-atlas). Country ids are ISO 3166-1 numeric. */
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const ANTARCTICA_ID = '010';
const STATUSES: RegionStatus[] = ['normal', 'review', 'suspicious'];

interface WorldRiskMapProps {
  data: RiskMapData;
  height?: number;
  center?: [number, number];
  zoomable?: boolean;
  selectedRegionId?: string | null;
  selectedCountryId?: string | null;
  onRegionClick?: (id: string) => void;
  onCountryClick?: (country: CountryRisk) => void;
}

type Hover = {kind: 'region';region: MapRegion;} | {kind: 'country';name: string;country?: CountryRisk;} | null;

export function WorldRiskMap({
  data,
  height = 300,
  center = [12, 24],
  zoomable = false,
  selectedRegionId = null,
  selectedCountryId = null,
  onRegionClick,
  onCountryClick
}: WorldRiskMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0 });
  const [view, setView] = useState<{coordinates: [number, number];zoom: number;}>({ coordinates: center, zoom: 1 });

  const countryById = useMemo(() => new Map(data.countries.map((c) => [c.id, c])), [data.countries]);
  const regionById = useMemo(() => new Map(data.regions.map((r) => [r.id, r])), [data.regions]);
  const maxRegionTx = Math.max(...data.regions.map((r) => r.transactionCount), 1);
  const maxFlow = Math.max(...data.flows.map((f) => f.volume), 1);
  const scale = 1 / view.zoom;
  const focusRegion = selectedRegionId;

  const onMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width });
  };

  const layers =
  <>
      <Graticule stroke="#d3e7f5" strokeWidth={0.4} step={[20, 20]} />
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
      geographies.
      filter((geo) => geo.id !== ANTARCTICA_ID).
      map((geo) => {
        const id = String(geo.id);
        const country = countryById.get(id);
        const isSelected = id === selectedCountryId;
        const inFocus = !focusRegion || country?.regionId === focusRegion;
        const fill = countryRiskFill(country?.riskScore);
        const base = {
          fill,
          stroke: isSelected ? '#0369a1' : '#ffffff',
          strokeWidth: isSelected ? 1.4 : 0.55,
          outline: 'none',
          opacity: inFocus ? 1 : 0.55,
          transition: 'fill 300ms ease-out, opacity 200ms ease-out',
          cursor: country && onCountryClick ? 'pointer' : 'default'
        };
        return (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            onMouseEnter={() => setHover({ kind: 'country', name: (geo.properties as {name?: string;}).name ?? 'Unknown', country })}
            onMouseLeave={() => setHover(null)}
            onClick={() => country && onCountryClick?.(country)}
            style={{
              default: base,
              hover: { ...base, stroke: '#0ea5e9', strokeWidth: 1, filter: 'brightness(0.97)' },
              pressed: base
            }} />);


      })
      }
      </Geographies>
      {data.flows.map((f, i) => {
      const from = regionById.get(f.from);
      const to = regionById.get(f.to);
      if (!from || !to) return null;
      return (
        <FlowArc
          key={f.id}
          index={i}
          from={from.coordinates}
          to={to.coordinates}
          color={REGION_STATUS_COLOR[f.status]}
          markerId={`arrow-${f.status}`}
          weight={f.volume / maxFlow}
          dimmed={!!focusRegion && f.from !== focusRegion && f.to !== focusRegion}
          scale={scale} />);


    })}
      {[...data.regions].
    sort((a, b) => a.id === selectedRegionId ? 1 : b.id === selectedRegionId ? -1 : 0).
    map((r) =>
    <RegionMarker
      key={r.id}
      region={r}
      weight={r.transactionCount / maxRegionTx}
      selected={r.id === selectedRegionId}
      dimmed={!!focusRegion && r.id !== focusRegion}
      scale={scale}
      onHover={(reg) => setHover(reg ? { kind: 'region', region: reg } : null)}
      onClick={onRegionClick} />

    )}
    </>;


  const zoomBy = (factor: number) => setView((v) => ({ ...v, zoom: Math.min(6, Math.max(1, v.zoom * factor)) }));

  return (
    <div ref={wrapRef} className="relative" onMouseMove={onMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 128, center }}
        width={800}
        height={height}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="World map of transaction risk by country and region">
        
        <defs>
          {STATUSES.map((s) =>
          <marker key={s} id={`arrow-${s}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,1 L9,5 L0,9 L2.5,5 z" fill={REGION_STATUS_COLOR[s]} />
            </marker>
          )}
        </defs>
        {zoomable ?
        <ZoomableGroup
          center={view.coordinates}
          zoom={view.zoom}
          minZoom={1}
          maxZoom={6}
          onMoveEnd={({ coordinates, zoom }: {coordinates: [number, number];zoom: number;}) => setView({ coordinates, zoom })}>
          
            {layers}
          </ZoomableGroup> :

        layers
        }
      </ComposableMap>

      {zoomable &&
      <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-float">
          <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.5)} className="flex h-9 w-9 items-center justify-center text-ink-muted transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700">
            <PlusIcon className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.5)} className="flex h-9 w-9 items-center justify-center border-y border-line text-ink-muted transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700">
            <MinusIcon className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" aria-label="Reset view" onClick={() => setView({ coordinates: center, zoom: 1 })} className="flex h-9 w-9 items-center justify-center text-ink-muted transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700">
            <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      }

      <AnimatePresence>
        {hover &&
        <motion.div
          key={hover.kind === 'region' ? hover.region.id : hover.name}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-none absolute z-20 w-52 rounded-xl border border-line bg-white/95 p-3 shadow-float backdrop-blur"
          style={{ left: pos.x + 230 > pos.w ? pos.x - 222 : pos.x + 14, top: Math.max(8, pos.y - 20) }}>
          
            {hover.kind === 'region' ?
          <>
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: REGION_STATUS_COLOR[hover.region.status] }} aria-hidden />
                  {hover.region.name}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-y-1 text-[11.5px]">
                  <dt className="text-ink-muted">Status</dt>
                  <dd className="text-right font-medium text-ink">{REGION_STATUS_LABEL[hover.region.status]}</dd>
                  <dt className="text-ink-muted">Transactions</dt>
                  <dd className="tabular text-right font-medium text-ink">{formatCompact(hover.region.transactionCount)}</dd>
                  <dt className="text-ink-muted">High-risk</dt>
                  <dd className="tabular text-right font-medium text-rose-600">{hover.region.highRiskCount}</dd>
                </dl>
              </> :

          <>
                <p className="text-[13px] font-semibold text-ink">{hover.name}</p>
                {hover.country ?
            <dl className="mt-2 grid grid-cols-2 gap-y-1 text-[11.5px]">
                    <dt className="text-ink-muted">Risk score</dt>
                    <dd className="tabular text-right font-medium text-ink">{hover.country.riskScore}/100</dd>
                    <dt className="text-ink-muted">Transactions</dt>
                    <dd className="tabular text-right font-medium text-ink">{formatCompact(hover.country.transactionCount)}</dd>
                    <dt className="text-ink-muted">High-risk</dt>
                    <dd className="tabular text-right font-medium text-rose-600">{hover.country.highRiskCount}</dd>
                  </dl> :

            <p className="mt-1 text-[11.5px] text-ink-soft">No monitored volume</p>
            }
              </>
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}