/**
 * ============================================================================
 *  LAKEHOUSE CONNECTION CONFIG  —  the ONLY file you need to edit to go live
 * ============================================================================
 *  1. Set `mode` to 'rest'.
 *  2. Set `baseUrl` to your lakehouse API / SQL gateway.
 *  3. Set `apiKey` (sent as `Authorization: Bearer <apiKey>`), or leave empty
 *     if auth is handled by cookies / a reverse proxy.
 *  Every endpoint below must return JSON matching types/dashboard.ts and
 *  types/operations.ts. See README.md for tables & SQL per endpoint.
 * ============================================================================
 */

export type DataMode = 'mock' | 'rest';

export interface LakehouseConfig {
  mode: DataMode;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  mockLatencyMs: number;
  logoutUrl: string;
  refreshIntervals: {
    kpis: number;
    activity: number;
    fraudRadar: number;
    riskDistribution: number;
    decisions: number;
    riskMap: number;
    fraudPatterns: number;
    pipelineHealth: number;
    liveFeed: number;
    infrastructure: number;
    streamStatus: number;
    notifications: number;
    alerts: number;
    lakehouseTables: number;
    syncJobs: number;
  };
}

export const lakehouseConfig: LakehouseConfig = {
  mode: 'rest',
  baseUrl: 'http://localhost:8000',
  apiKey: '',
  timeoutMs: 15000,
  mockLatencyMs: 400,
  /** Leave empty to stay in-app; set to your SSO logout URL in production. */
  logoutUrl: '',
  refreshIntervals: {
    kpis: 30000,
    activity: 15000,
    fraudRadar: 20000,
    riskDistribution: 60000,
    decisions: 30000,
    riskMap: 10000,
    fraudPatterns: 60000,
    pipelineHealth: 15000,
    liveFeed: 3000,
    infrastructure: 15000,
    streamStatus: 5000,
    notifications: 30000,
    alerts: 20000,
    lakehouseTables: 30000,
    syncJobs: 2000
  }
};

/** REST paths relative to baseUrl. `:id` segments are replaced by the client. */
export const ENDPOINTS = {
  kpis: '/api/v1/metrics/kpis',
  activity: '/api/v1/transactions/activity',
  fraudRadar: '/api/v1/fraud/radar',
  riskDistribution: '/api/v1/risk/distribution',
  decisions: '/api/v1/transactions/decisions',
  riskMap: '/api/v1/risk/geo',
  fraudPatterns: '/api/v1/fraud/patterns',
  fraudPatternDetails: '/api/v1/fraud/patterns/details',
  pipelineHealth: '/api/v1/pipeline/health',
  liveFeed: '/api/v1/transactions/live',
  transactions: '/api/v1/transactions',
  infrastructure: '/api/v1/infrastructure/status',
  streamStatus: '/api/v1/stream/status',
  notifications: '/api/v1/notifications',
  notificationsReadAll: '/api/v1/notifications/read-all',
  currentUser: '/api/v1/me',
  search: '/api/v1/search',
  fraudRules: '/api/v1/fraud/rules',
  alerts: '/api/v1/alerts',
  lakehouseTables: '/api/v1/lakehouse/tables',
  syncJobs: '/api/v1/sync/jobs',
  settings: '/api/v1/settings',
  logout: '/api/v1/auth/logout'
} as const;