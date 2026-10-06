/**
 * Single data-access layer for the whole app.
 * UI components NEVER call fetch directly — they use hooks in hooks/,
 * which call `lakehouseApi` below. To connect real data, edit utils/lakehouseConfig.ts.
 */
import {
  mockCurrentUser,
  mockFraudPatterns,
  mockFraudRadar,
  mockInfrastructure,
  mockKpis,
  mockNotifications,
  mockPipelineHealth,
  mockRiskDistribution,
  mockTransactionDecisions } from
'../data/dashboardMock';
import { mockPatternDetails } from '../data/operationsMock';
import { ENDPOINTS, lakehouseConfig } from './lakehouseConfig';
import {
  buildActivitySeries,
  mockSearch,
  mockStreamStatus,
  nextMockLiveFeed,
  nextMockRiskMap,
  queryMockTransactions } from
'./mockGenerators';
import { mockStore } from './mockStore';
import type {
  ActivitySeries,
  AppNotification,
  FraudPattern,
  FraudRadar,
  InfraService,
  KpiMetric,
  LiveTransaction,
  PipelineMetric,
  RiskDistributionItem,
  RiskMapData,
  SearchResult,
  StreamStatus,
  TimeRange,
  TransactionDecisionSummary,
  UserProfile } from
'../types/dashboard';
import type {
  AlertStatus,
  AppSettings,
  FraudPatternDetail,
  FraudRule,
  LakehouseTable,
  NewFraudRule,
  RiskAlertItem,
  SyncJob,
  TransactionPage,
  TransactionQuery } from
'../types/operations';

export class LakehouseError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LakehouseError';
    this.status = status;
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

async function request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), lakehouseConfig.timeoutMs);
  signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(`${lakehouseConfig.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(lakehouseConfig.apiKey ? { Authorization: `Bearer ${lakehouseConfig.apiKey}` } : {}),
        ...init.headers
      }
    });
    if (!response.ok) {
      throw new LakehouseError(`Request failed (${response.status}) for ${path}`, response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolve<T>(path: string, mock: () => T, signal?: AbortSignal, init?: RequestInit): Promise<T> {
  if (lakehouseConfig.mode === 'mock') {
    await delay(lakehouseConfig.mockLatencyMs, signal);
    return mock();
  }
  return request<T>(path, init, signal);
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

function qs(params: Record<string, string | number>): string {
  return new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
}

export const lakehouseApi = {
  /* ---------- Overview ---------- */
  getKpis: (signal?: AbortSignal) => resolve<KpiMetric[]>(ENDPOINTS.kpis, () => mockKpis, signal),
  getActivity: (range: TimeRange, signal?: AbortSignal) =>
  resolve<ActivitySeries>(`${ENDPOINTS.activity}?range=${range}`, () => buildActivitySeries(range), signal),
  getFraudRadar: (signal?: AbortSignal) => resolve<FraudRadar>(ENDPOINTS.fraudRadar, () => mockFraudRadar, signal),
  getRiskDistribution: (signal?: AbortSignal) =>
  resolve<RiskDistributionItem[]>(ENDPOINTS.riskDistribution, () => mockRiskDistribution, signal),
  getTransactionDecisions: (signal?: AbortSignal) =>
  resolve<TransactionDecisionSummary>(ENDPOINTS.decisions, () => mockTransactionDecisions, signal),
  getRiskMap: (signal?: AbortSignal) => resolve<RiskMapData>(ENDPOINTS.riskMap, () => nextMockRiskMap(), signal),
  getFraudPatterns: (limit = 5, signal?: AbortSignal) =>
  resolve<FraudPattern[]>(`${ENDPOINTS.fraudPatterns}?limit=${limit}`, () => mockFraudPatterns.slice(0, limit), signal),
  getPipelineHealth: (signal?: AbortSignal) =>
  resolve<PipelineMetric[]>(ENDPOINTS.pipelineHealth, () => mockPipelineHealth, signal),
  getLiveFeed: (limit = 5, signal?: AbortSignal) =>
  resolve<LiveTransaction[]>(`${ENDPOINTS.liveFeed}?limit=${limit}`, () => nextMockLiveFeed(limit), signal),
  getInfrastructure: (signal?: AbortSignal) =>
  resolve<InfraService[]>(ENDPOINTS.infrastructure, () => mockInfrastructure, signal),
  getStreamStatus: (signal?: AbortSignal) => resolve<StreamStatus>(ENDPOINTS.streamStatus, () => mockStreamStatus(), signal),

  /* ---------- Shell ---------- */
  getNotifications: (signal?: AbortSignal) =>
  resolve<AppNotification[]>(ENDPOINTS.notifications, () => mockNotifications, signal),
  markAllNotificationsRead: () => resolve<void>(ENDPOINTS.notificationsReadAll, () => undefined, undefined, json('POST')),
  getCurrentUser: (signal?: AbortSignal) => resolve<UserProfile>(ENDPOINTS.currentUser, () => mockCurrentUser, signal),
  search: (query: string, signal?: AbortSignal) =>
  resolve<SearchResult[]>(`${ENDPOINTS.search}?q=${encodeURIComponent(query)}`, () => mockSearch(query), signal),
  logout: () => resolve<void>(ENDPOINTS.logout, () => undefined, undefined, json('POST')),

  /* ---------- Transactions ---------- */
  getTransactions: (query: TransactionQuery, signal?: AbortSignal) =>
  resolve<TransactionPage>(`${ENDPOINTS.transactions}?${qs({ ...query })}`, () => queryMockTransactions(query), signal),

  /* ---------- Fraud rules ---------- */
  getFraudRules: (signal?: AbortSignal) => resolve<FraudRule[]>(ENDPOINTS.fraudRules, () => mockStore.listRules(), signal),
  createFraudRule: (input: NewFraudRule) =>
  resolve<FraudRule>(ENDPOINTS.fraudRules, () => mockStore.createRule(input), undefined, json('POST', input)),
  updateFraudRule: (id: string, patch: Partial<FraudRule>) =>
  resolve<FraudRule>(`${ENDPOINTS.fraudRules}/${id}`, () => mockStore.updateRule(id, patch), undefined, json('PATCH', patch)),
  deleteFraudRule: (id: string) =>
  resolve<void>(`${ENDPOINTS.fraudRules}/${id}`, () => mockStore.deleteRule(id), undefined, json('DELETE')),

  /* ---------- Patterns ---------- */
  getFraudPatternDetails: (signal?: AbortSignal) =>
  resolve<FraudPatternDetail[]>(ENDPOINTS.fraudPatternDetails, () => mockPatternDetails, signal),

  /* ---------- Alerts ---------- */
  getAlerts: (signal?: AbortSignal) => resolve<RiskAlertItem[]>(ENDPOINTS.alerts, () => mockStore.listAlerts(), signal),
  updateAlertStatus: (id: string, status: AlertStatus) =>
  resolve<RiskAlertItem>(`${ENDPOINTS.alerts}/${id}`, () => mockStore.updateAlertStatus(id, status), undefined, json('PATCH', { status })),

  /* ---------- Lakehouse ---------- */
  getLakehouseTables: (signal?: AbortSignal) =>
  resolve<LakehouseTable[]>(ENDPOINTS.lakehouseTables, () => mockStore.listTables(), signal),
  refreshLakehouseTable: (id: string) =>
  resolve<LakehouseTable>(`${ENDPOINTS.lakehouseTables}/${id}/refresh`, () => mockStore.refreshTable(id), undefined, json('POST')),

  /* ---------- Cloud sync ---------- */
  getSyncJobs: (signal?: AbortSignal) => resolve<SyncJob[]>(ENDPOINTS.syncJobs, () => mockStore.listSyncJobs(), signal),
  triggerSync: (id: string) =>
  resolve<SyncJob>(`${ENDPOINTS.syncJobs}/${id}/run`, () => mockStore.triggerSync(id), undefined, json('POST')),
  updateSyncJob: (id: string, patch: Partial<SyncJob>) =>
  resolve<SyncJob>(`${ENDPOINTS.syncJobs}/${id}`, () => mockStore.updateSyncJob(id, patch), undefined, json('PATCH', patch)),

  /* ---------- Settings ---------- */
  getSettings: (signal?: AbortSignal) => resolve<AppSettings>(ENDPOINTS.settings, () => mockStore.getSettings(), signal),
  updateSettings: (next: AppSettings) =>
  resolve<AppSettings>(ENDPOINTS.settings, () => mockStore.updateSettings(next), undefined, json('PUT', next))
};