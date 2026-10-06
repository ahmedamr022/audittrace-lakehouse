/**
 * In-memory mutable store so every button works in mock mode
 * (toggle rules, resolve alerts, trigger syncs, save settings…).
 * Ignored entirely when lakehouseConfig.mode === 'rest'.
 */
import {
  mockAlerts,
  mockFraudRules,
  mockLakehouseTables,
  mockSettings,
  mockSyncJobs } from
'../data/operationsMock';
import type {
  AlertStatus,
  AppSettings,
  FraudRule,
  LakehouseTable,
  NewFraudRule,
  RiskAlertItem,
  SyncJob } from
'../types/operations';

let rules: FraudRule[] = mockFraudRules.map((r) => ({ ...r }));
let alerts: RiskAlertItem[] = mockAlerts.map((a) => ({ ...a }));
let tables: LakehouseTable[] = mockLakehouseTables.map((t) => ({ ...t }));
let syncJobs: SyncJob[] = mockSyncJobs.map((j) => ({ ...j }));
let settings: AppSettings = { ...mockSettings };

export const mockStore = {
  listRules: () => rules,
  createRule: (input: NewFraudRule): FraudRule => {
    const rule: FraudRule = { ...input, id: `rule_${Date.now()}`, enabled: true, hits24h: 0, updatedAt: new Date().toISOString() };
    rules = [rule, ...rules];
    return rule;
  },
  updateRule: (id: string, patch: Partial<FraudRule>): FraudRule => {
    rules = rules.map((r) => r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r);
    const found = rules.find((r) => r.id === id);
    if (!found) throw new Error('Rule not found');
    return found;
  },
  deleteRule: (id: string) => {
    rules = rules.filter((r) => r.id !== id);
  },

  listAlerts: () => alerts,
  updateAlertStatus: (id: string, status: AlertStatus): RiskAlertItem => {
    alerts = alerts.map((a) => a.id === id ? { ...a, status } : a);
    const found = alerts.find((a) => a.id === id);
    if (!found) throw new Error('Alert not found');
    return found;
  },

  listTables: () => tables,
  refreshTable: (id: string): LakehouseTable => {
    tables = tables.map((t) =>
    t.id === id ?
    { ...t, lastUpdated: new Date().toISOString(), rowCount: t.rowCount + Math.floor(Math.random() * 5000), status: 'healthy' } :
    t
    );
    const found = tables.find((t) => t.id === id);
    if (!found) throw new Error('Table not found');
    return found;
  },

  listSyncJobs: () => syncJobs,
  triggerSync: (id: string): SyncJob => {
    syncJobs = syncJobs.map((j) => j.id === id ? { ...j, status: 'running' } : j);
    window.setTimeout(() => {
      syncJobs = syncJobs.map((j) =>
      j.id === id ?
      { ...j, status: 'success', lastRunAt: new Date().toISOString(), rowsSynced: j.rowsSynced + Math.floor(1000 + Math.random() * 40000) } :
      j
      );
    }, 2600);
    const found = syncJobs.find((j) => j.id === id);
    if (!found) throw new Error('Sync job not found');
    return found;
  },
  updateSyncJob: (id: string, patch: Partial<SyncJob>): SyncJob => {
    syncJobs = syncJobs.map((j) => j.id === id ? { ...j, ...patch } : j);
    const found = syncJobs.find((j) => j.id === id);
    if (!found) throw new Error('Sync job not found');
    return found;
  },

  getSettings: () => settings,
  updateSettings: (next: AppSettings): AppSettings => {
    settings = { ...next };
    return settings;
  }
};