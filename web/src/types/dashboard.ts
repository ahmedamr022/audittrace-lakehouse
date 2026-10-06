/**
 * Data contracts for the Risk & Fraud Intelligence dashboard.
 * Every lakehouse endpoint MUST return JSON matching these shapes exactly.
 * See README.md for the endpoint ↔ type ↔ suggested lakehouse table mapping.
 */

export type TimeRange = '1H' | '6H' | '24H' | '7D';

export type KpiId =
'total_transactions' |
'fraud_risk' |
'blocked_value' |
'avg_processing' |
'data_quality';

export type KpiFormat = 'compact' | 'percent' | 'currency' | 'milliseconds';

export interface KpiMetric {
  id: KpiId;
  label: string;
  /** Raw numeric value (e.g. 2840000, 1.82, 428600, 1.62, 99.97) */
  value: number;
  format: KpiFormat;
  /** ISO 4217 code, required when format === 'currency' */
  currency?: string;
  /** Period-over-period change in percent (e.g. 12.4, -0.31) */
  deltaPercent: number;
  /** Whether the change is good for the business (drives color) */
  isPositive: boolean;
  /** 8–20 recent values for the mini trend line */
  sparkline: number[];
}

export interface ActivityPoint {
  /** ISO timestamp of the bucket start */
  timestamp: string;
  /** Pre-formatted axis label (e.g. "03:00", "Mon") */
  label: string;
  approved: number;
  review: number;
  declined: number;
}

export interface ActivitySeries {
  range: TimeRange;
  points: ActivityPoint[];
  /** Axis label of the bucket that represents "now"; null hides the marker */
  liveLabel: string | null;
}

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type SignalIcon =
'impossible_travel' |
'velocity_spike' |
'device_anomaly' |
'card_testing' |
'account_takeover';

export interface RiskSignal {
  id: string;
  name: string;
  severity: Severity;
  icon: SignalIcon;
}

export interface RiskAlert {
  title: string;
  message: string;
  accountsAffected: number;
}

export interface FraudRadar {
  /** 0–100 */
  detectionConfidence: number;
  signals: RiskSignal[];
  /** null when there is no active high-risk alert */
  alert: RiskAlert | null;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskDistributionItem {
  level: RiskLevel;
  /** 0–100 */
  percent: number;
  count: number;
}

export type Decision = 'Approved' | 'Review' | 'Declined';

export interface DecisionBreakdown {
  decision: Decision;
  percent: number;
  count: number;
}

export interface TransactionDecisionSummary {
  total: number;
  breakdown: DecisionBreakdown[];
}

export type RegionStatus = 'normal' | 'review' | 'suspicious';

export interface MapRegion {
  id: string;
  name: string;
  /** [longitude, latitude] */
  coordinates: [number, number];
  status: RegionStatus;
  transactionCount: number;
  highRiskCount: number;
  showLabel: boolean;
  labelPosition: 'top' | 'bottom' | 'left' | 'right';
}

export interface MapFlow {
  id: string;
  /** MapRegion.id */
  from: string;
  /** MapRegion.id */
  to: string;
  status: RegionStatus;
  volume: number;
}

export interface CountryRisk {
  /** ISO 3166-1 numeric code as a 3-digit string (matches world-atlas ids, e.g. "840") */
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2 */
  iso2: string;
  /** 0–100 aggregated risk score — drives the country shading */
  riskScore: number;
  transactionCount: number;
  highRiskCount: number;
  /** MapRegion.id this country rolls up into */
  regionId: string;
}

export interface RiskMapData {
  highRiskEvents: number;
  regions: MapRegion[];
  flows: MapFlow[];
  countries: CountryRisk[];
  /** ISO timestamp of the snapshot */
  updatedAt: string;
}

export interface FraudPattern {
  id: string;
  name: string;
  percent: number;
}

export interface LiveTransaction {
  id: string;
  /** ISO timestamp */
  timestamp: string;
  transactionId: string;
  /** ISO 3166-1 alpha-2 country code */
  region: string;
  amount: number;
  currency: string;
  /** 0–100 */
  riskScore: number;
  decision: Decision;
}

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export type PipelineIcon = 'kafka_lag' | 'throughput' | 'lakehouse' | 'dbt' | 'great_expectations';

export interface PipelineMetric {
  id: string;
  name: string;
  /** Pre-formatted display value (e.g. "12 ms", "142K msg/s", "All Healthy") */
  value: string;
  status: HealthStatus;
  icon: PipelineIcon;
}

export type InfraIcon = 'kafka' | 'postgresql' | 'redis' | 'airflow' | 'duckdb';

export interface InfraService {
  id: string;
  name: string;
  status: HealthStatus;
  icon: InfraIcon;
}

export interface StreamStatus {
  connected: boolean;
  latencyMs: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: Severity;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export type SearchResultType = 'transaction' | 'account' | 'country';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
}