/**
 * Data contracts for the operational pages (Transactions, Fraud Rules, Lakehouse,
 * Patterns, Alerts, Settings, Cloud Sync). Endpoints in README.md.
 */
import type { Decision, HealthStatus, LiveTransaction, Severity, TimeRange } from './dashboard';

export type RuleAction = 'Review' | 'Decline';

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  /** FraudPattern.id this rule detects */
  pattern: string;
  /** Risk score (0–100) at which the rule fires */
  threshold: number;
  action: RuleAction;
  enabled: boolean;
  hits24h: number;
  updatedAt: string;
}

export type NewFraudRule = Pick<FraudRule, 'name' | 'description' | 'pattern' | 'threshold' | 'action'>;

export type AlertStatus = 'open' | 'acknowledged' | 'resolved';

export interface RiskAlertItem {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  status: AlertStatus;
  timestamp: string;
  region: string;
  pattern: string;
  accountsAffected: number;
  amountAtRisk: number;
  currency: string;
}

export type LakehouseLayer = 'bronze' | 'silver' | 'gold';

export interface LakehouseTable {
  id: string;
  name: string;
  layer: LakehouseLayer;
  rowCount: number;
  sizeBytes: number;
  lastUpdated: string;
  /** 0–100 Great Expectations pass rate */
  qualityScore: number;
  status: HealthStatus;
}

export type SyncStatus = 'idle' | 'running' | 'success' | 'failed';

export interface SyncJob {
  id: string;
  name: string;
  destination: string;
  schedule: string;
  enabled: boolean;
  status: SyncStatus;
  lastRunAt: string | null;
  rowsSynced: number;
}

export interface AppSettings {
  defaultRange: TimeRange;
  liveOnLoad: boolean;
  reviewThreshold: number;
  declineThreshold: number;
  emailAlerts: boolean;
  slackAlerts: boolean;
  smsAlerts: boolean;
  alertMinSeverity: Severity;
}

export interface FraudPatternDetail {
  id: string;
  name: string;
  percent: number;
  cases: number;
  changePercent: number;
  trend: number[];
  description: string;
  topRegions: string[];
}

export interface TransactionQuery {
  q: string;
  decision: Decision | 'all';
  region: string;
  page: number;
  pageSize: number;
}

export interface TransactionPage {
  items: LiveTransaction[];
  total: number;
  page: number;
  pageSize: number;
}