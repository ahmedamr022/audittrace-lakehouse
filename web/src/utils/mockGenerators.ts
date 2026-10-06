/** Mock-only generators. Not used when lakehouseConfig.mode === 'rest'. */
import {
  mockActivity24h,
  mockLiveFeedSeed,
  mockRiskMap,
  mockSearchIndex } from
'../data/dashboardMock';
import type {
  ActivityPoint,
  ActivitySeries,
  CountryRisk,
  Decision,
  LiveTransaction,
  RegionStatus,
  RiskMapData,
  SearchResult,
  StreamStatus,
  TimeRange } from
'../types/dashboard';
import type { TransactionPage, TransactionQuery } from '../types/operations';

const REGIONS: {code: string;currency: string;}[] = [
{ code: 'US', currency: 'USD' },
{ code: 'GB', currency: 'GBP' },
{ code: 'AE', currency: 'AED' },
{ code: 'SG', currency: 'SGD' },
{ code: 'CA', currency: 'CAD' },
{ code: 'DE', currency: 'EUR' },
{ code: 'SA', currency: 'SAR' },
{ code: 'IN', currency: 'INR' },
{ code: 'AU', currency: 'AUD' },
{ code: 'JP', currency: 'JPY' }];


function wave(i: number, base: number, amp: number, seed: number): number {
  return Math.round(base + Math.sin(i * 0.9 + seed) * amp + Math.cos(i * 0.37 + seed) * amp * 0.6 + i * amp * 0.08);
}

function buildPoints(count: number, stepMs: number, label: (d: Date) => string, scale: number): ActivityPoint[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now - (count - 1 - i) * stepMs);
    return {
      timestamp: date.toISOString(),
      label: label(date),
      approved: Math.max(0, wave(i, 130000 * scale, 22000 * scale, 1)),
      review: Math.max(0, wave(i, 58000 * scale, 9000 * scale, 2)),
      declined: Math.max(0, wave(i, 20000 * scale, 3000 * scale, 3))
    };
  });
}

const hhmm = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export function buildActivitySeries(range: TimeRange): ActivitySeries {
  if (range === '24H') return { range, points: mockActivity24h, liveLabel: '15:00' };
  if (range === '1H') {
    const points = buildPoints(13, 5 * 60000, hhmm, 0.09);
    return { range, points, liveLabel: points[points.length - 1].label };
  }
  if (range === '6H') {
    const points = buildPoints(13, 30 * 60000, hhmm, 0.5);
    return { range, points, liveLabel: points[points.length - 1].label };
  }
  const points = buildPoints(7, 24 * 3600000, (d) => d.toLocaleDateString('en-US', { weekday: 'short' }), 22);
  return { range, points, liveLabel: points[points.length - 1].label };
}

let feed: LiveTransaction[] = [...mockLiveFeedSeed];
let feedInitialized = false;

function randomId(): string {
  return `TXN_${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
}

function decisionFor(score: number): Decision {
  if (score >= 80) return 'Declined';
  if (score >= 40) return 'Review';
  return 'Approved';
}

function randomTransaction(): LiveTransaction {
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const riskScore = Math.random() < 0.7 ? Math.floor(Math.random() * 40) : Math.floor(40 + Math.random() * 60);
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    transactionId: randomId(),
    region: region.code,
    amount: Math.round((50 + Math.random() * 9500) * 100) / 100,
    currency: region.currency,
    riskScore,
    decision: decisionFor(riskScore)
  };
}

export function nextMockLiveFeed(limit: number): LiveTransaction[] {
  if (feedInitialized) feed = [randomTransaction(), ...feed].slice(0, 50);
  feedInitialized = true;
  return feed.slice(0, limit);
}

export function mockStreamStatus(): StreamStatus {
  return { connected: true, latencyMs: Math.round((1.45 + Math.random() * 0.35) * 100) / 100 };
}

/* ---------------- Risk map: evolving snapshot ---------------- */

let mapCountries: CountryRisk[] = mockRiskMap.countries.map((c) => ({ ...c }));
let mapTicks = 0;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function statusFromScore(score: number): RegionStatus {
  if (score >= 70) return 'suspicious';
  if (score >= 50) return 'review';
  return 'normal';
}

/** Each call drifts country risk & volume a little, then re-aggregates regions — like a live snapshot. */
export function nextMockRiskMap(): RiskMapData {
  if (mapTicks > 0) {
    mapCountries = mapCountries.map((c) => {
      const riskScore = clamp(Math.round(c.riskScore + (Math.random() - 0.5) * 8), 5, 98);
      const transactionCount = Math.max(1000, Math.round(c.transactionCount * (1 + (Math.random() - 0.45) * 0.03)));
      const highRiskCount = Math.max(0, Math.round(c.highRiskCount + (Math.random() - 0.4) * Math.max(2, c.highRiskCount * 0.08)));
      return { ...c, riskScore, transactionCount, highRiskCount };
    });
  }
  mapTicks += 1;

  const regions = mockRiskMap.regions.map((r) => {
    const members = mapCountries.filter((c) => c.regionId === r.id);
    if (members.length === 0) return r;
    const tx = members.reduce((s, c) => s + c.transactionCount, 0);
    const hr = members.reduce((s, c) => s + c.highRiskCount, 0);
    const weighted = members.reduce((s, c) => s + c.riskScore * c.transactionCount, 0) / tx;
    return { ...r, transactionCount: tx, highRiskCount: hr, status: statusFromScore(weighted) };
  });

  const statusById = new Map(regions.map((r) => [r.id, r.status]));
  const rank: Record<RegionStatus, number> = { normal: 0, review: 1, suspicious: 2 };
  const flows = mockRiskMap.flows.map((f) => {
    const a = statusById.get(f.from) ?? 'normal';
    const b = statusById.get(f.to) ?? 'normal';
    const worst = rank[a] >= rank[b] ? a : b;
    const status: RegionStatus = worst === 'suspicious' && rank[a] + rank[b] < 4 ? 'review' : worst;
    return { ...f, status, volume: Math.round(f.volume * (0.95 + Math.random() * 0.1)) };
  });

  return {
    highRiskEvents: regions.reduce((s, r) => s + r.highRiskCount, 0),
    regions,
    flows,
    countries: mapCountries,
    updatedAt: new Date().toISOString()
  };
}

/* ---------------- Transactions explorer ---------------- */

function seeded(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

let history: LiveTransaction[] | null = null;

function getHistory(): LiveTransaction[] {
  if (history) return history;
  const rand = seeded(42);
  const start = Date.now() - 60000;
  history = Array.from({ length: 140 }, (_, i) => {
    const region = REGIONS[Math.floor(rand() * REGIONS.length)];
    const riskScore = rand() < 0.7 ? Math.floor(rand() * 40) : Math.floor(40 + rand() * 60);
    return {
      id: `hist_${i}`,
      timestamp: new Date(start - i * 37000).toISOString(),
      transactionId: `TXN_${Math.floor(rand() * 36 ** 10).toString(36).toUpperCase().padStart(10, '0')}`,
      region: region.code,
      amount: Math.round((40 + rand() * 9800) * 100) / 100,
      currency: region.currency,
      riskScore,
      decision: decisionFor(riskScore)
    };
  });
  return history;
}

export function queryMockTransactions(query: TransactionQuery): TransactionPage {
  const q = query.q.trim().toLowerCase();
  const all = [...feed, ...getHistory()];
  const filtered = all.filter(
    (t) =>
    (!q || t.transactionId.toLowerCase().includes(q) || t.region.toLowerCase() === q) && (
    query.decision === 'all' || t.decision === query.decision) && (
    query.region === 'all' || t.region === query.region)
  );
  const startIdx = (query.page - 1) * query.pageSize;
  return { items: filtered.slice(startIdx, startIdx + query.pageSize), total: filtered.length, page: query.page, pageSize: query.pageSize };
}

export function mockSearch(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return mockSearchIndex.filter((r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q));
}