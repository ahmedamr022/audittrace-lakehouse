/**
 * MOCK DATA — used only while lakehouseConfig.mode === 'mock'.
 * Shapes mirror the real lakehouse API contracts in types/dashboard.ts.
 */
import type {
  ActivityPoint,
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
  TransactionDecisionSummary,
  UserProfile } from
'../types/dashboard';
import { mockCountryRisk } from './operationsMock';

export const mockKpis: KpiMetric[] = [
{
  id: 'total_transactions',
  label: 'Total Transactions',
  value: 2840000,
  format: 'compact',
  deltaPercent: 12.4,
  isPositive: true,
  sparkline: [32, 34, 31, 36, 35, 38, 37, 41, 40, 44, 46, 50]
},
{
  id: 'fraud_risk',
  label: 'Fraud Risk',
  value: 1.82,
  format: 'percent',
  deltaPercent: -0.31,
  isPositive: true,
  sparkline: [30, 33, 31, 35, 34, 38, 33, 36, 40, 37, 42, 41]
},
{
  id: 'blocked_value',
  label: 'Blocked Value',
  value: 428600,
  format: 'currency',
  currency: 'USD',
  deltaPercent: 8.7,
  isPositive: true,
  sparkline: [20, 22, 21, 24, 23, 27, 26, 30, 29, 34, 38, 44]
},
{
  id: 'avg_processing',
  label: 'Avg Processing',
  value: 1.62,
  format: 'milliseconds',
  deltaPercent: 0,
  isPositive: true,
  sparkline: [18, 22, 20, 26, 24, 30, 27, 33, 31, 38, 36, 42]
},
{
  id: 'data_quality',
  label: 'Data Quality',
  value: 99.97,
  format: 'percent',
  deltaPercent: 0.02,
  isPositive: true,
  sparkline: [24, 25, 27, 26, 29, 28, 31, 33, 32, 35, 38, 41]
}];


export const mockActivity24h: ActivityPoint[] = [
{ timestamp: '2026-10-05T00:00:00', label: '00:00', approved: 72000, review: 32000, declined: 12000 },
{ timestamp: '2026-10-05T01:00:00', label: '01:00', approved: 85000, review: 38000, declined: 14000 },
{ timestamp: '2026-10-05T02:00:00', label: '02:00', approved: 95000, review: 42000, declined: 15000 },
{ timestamp: '2026-10-05T03:00:00', label: '03:00', approved: 88000, review: 40000, declined: 14000 },
{ timestamp: '2026-10-05T04:00:00', label: '04:00', approved: 100000, review: 45000, declined: 16000 },
{ timestamp: '2026-10-05T05:00:00', label: '05:00', approved: 110000, review: 50000, declined: 18000 },
{ timestamp: '2026-10-05T06:00:00', label: '06:00', approved: 104000, review: 48000, declined: 17000 },
{ timestamp: '2026-10-05T07:00:00', label: '07:00', approved: 118000, review: 55000, declined: 19000 },
{ timestamp: '2026-10-05T08:00:00', label: '08:00', approved: 125000, review: 58000, declined: 20000 },
{ timestamp: '2026-10-05T09:00:00', label: '09:00', approved: 120000, review: 55000, declined: 19000 },
{ timestamp: '2026-10-05T10:00:00', label: '10:00', approved: 135000, review: 62000, declined: 21000 },
{ timestamp: '2026-10-05T11:00:00', label: '11:00', approved: 150000, review: 68000, declined: 22000 },
{ timestamp: '2026-10-05T12:00:00', label: '12:00', approved: 160000, review: 72000, declined: 24000 },
{ timestamp: '2026-10-05T13:00:00', label: '13:00', approved: 175000, review: 78000, declined: 25000 },
{ timestamp: '2026-10-05T14:00:00', label: '14:00', approved: 166000, review: 74000, declined: 23000 },
{ timestamp: '2026-10-05T15:00:00', label: '15:00', approved: 172000, review: 76000, declined: 24000 },
{ timestamp: '2026-10-05T16:00:00', label: '16:00', approved: 164000, review: 72000, declined: 23000 },
{ timestamp: '2026-10-05T17:00:00', label: '17:00', approved: 180000, review: 80000, declined: 26000 },
{ timestamp: '2026-10-05T18:00:00', label: '18:00', approved: 170000, review: 75000, declined: 24000 },
{ timestamp: '2026-10-05T19:00:00', label: '19:00', approved: 178000, review: 78000, declined: 25000 },
{ timestamp: '2026-10-05T20:00:00', label: '20:00', approved: 186000, review: 82000, declined: 26000 },
{ timestamp: '2026-10-05T21:00:00', label: '21:00', approved: 192000, review: 85000, declined: 27000 },
{ timestamp: '2026-10-05T22:00:00', label: '22:00', approved: 176000, review: 78000, declined: 25000 },
{ timestamp: '2026-10-05T23:00:00', label: '23:00', approved: 158000, review: 70000, declined: 22000 },
{ timestamp: '2026-10-06T00:00:00', label: '24:00', approved: 140000, review: 60000, declined: 20000 }];


export const mockFraudRadar: FraudRadar = {
  detectionConfidence: 94.5,
  signals: [
  { id: 'sig_travel', name: 'Impossible Travel', severity: 'High', icon: 'impossible_travel' },
  { id: 'sig_velocity', name: 'Velocity Spike', severity: 'Medium', icon: 'velocity_spike' },
  { id: 'sig_device', name: 'Device Anomaly', severity: 'Medium', icon: 'device_anomaly' }],

  alert: {
    title: 'High-risk activity detected',
    message: 'Multiple signals matched across 3 accounts',
    accountsAffected: 3
  }
};

export const mockRiskDistribution: RiskDistributionItem[] = [
{ level: 'Low', percent: 72.4, count: 2056160 },
{ level: 'Medium', percent: 18.7, count: 531080 },
{ level: 'High', percent: 6.2, count: 176080 },
{ level: 'Critical', percent: 2.7, count: 76680 }];


export const mockTransactionDecisions: TransactionDecisionSummary = {
  total: 2840000,
  breakdown: [
  { decision: 'Approved', percent: 86.2, count: 2448080 },
  { decision: 'Review', percent: 10.4, count: 295360 },
  { decision: 'Declined', percent: 3.4, count: 96560 }]

};

export const mockRiskMap: RiskMapData = {
  highRiskEvents: 420,
  regions: [
  { id: 'north_america', name: 'North America', coordinates: [-98, 39], status: 'suspicious', transactionCount: 912000, highRiskCount: 148, showLabel: true, labelPosition: 'top' },
  { id: 'europe', name: 'Europe', coordinates: [12, 49], status: 'review', transactionCount: 684000, highRiskCount: 72, showLabel: true, labelPosition: 'top' },
  { id: 'asia', name: 'Asia', coordinates: [108, 33], status: 'suspicious', transactionCount: 731000, highRiskCount: 121, showLabel: true, labelPosition: 'right' },
  { id: 'middle_east', name: 'Middle East', coordinates: [50, 24], status: 'suspicious', transactionCount: 214000, highRiskCount: 58, showLabel: false, labelPosition: 'right' },
  { id: 'south_america', name: 'South America', coordinates: [-56, -12], status: 'normal', transactionCount: 162000, highRiskCount: 9, showLabel: true, labelPosition: 'left' },
  { id: 'africa', name: 'Africa', coordinates: [23, -4], status: 'normal', transactionCount: 71000, highRiskCount: 6, showLabel: true, labelPosition: 'right' },
  { id: 'australia', name: 'Australia', coordinates: [134, -25], status: 'normal', transactionCount: 66000, highRiskCount: 6, showLabel: true, labelPosition: 'right' }],

  flows: [
  { id: 'f1', from: 'north_america', to: 'europe', status: 'review', volume: 120000 },
  { id: 'f2', from: 'north_america', to: 'asia', status: 'normal', volume: 98000 },
  { id: 'f3', from: 'europe', to: 'asia', status: 'suspicious', volume: 76000 },
  { id: 'f4', from: 'north_america', to: 'south_america', status: 'normal', volume: 54000 },
  { id: 'f5', from: 'south_america', to: 'africa', status: 'review', volume: 21000 },
  { id: 'f6', from: 'europe', to: 'africa', status: 'normal', volume: 33000 },
  { id: 'f7', from: 'asia', to: 'australia', status: 'normal', volume: 41000 },
  { id: 'f8', from: 'middle_east', to: 'africa', status: 'normal', volume: 18000 },
  { id: 'f9', from: 'north_america', to: 'middle_east', status: 'suspicious', volume: 26000 },
  { id: 'f10', from: 'europe', to: 'middle_east', status: 'review', volume: 30000 },
  { id: 'f11', from: 'south_america', to: 'europe', status: 'normal', volume: 25000 }],

  countries: mockCountryRisk,
  updatedAt: '2026-10-05T21:42:00'
};

export const mockFraudPatterns: FraudPattern[] = [
{ id: 'impossible_travel', name: 'Impossible Travel', percent: 32.4 },
{ id: 'velocity_spike', name: 'Velocity Spike', percent: 24.7 },
{ id: 'card_testing', name: 'Card Testing', percent: 18.9 },
{ id: 'device_mismatch', name: 'Device Mismatch', percent: 13.6 },
{ id: 'account_takeover', name: 'Account Takeover', percent: 10.4 }];


export const mockPipelineHealth: PipelineMetric[] = [
{ id: 'kafka_lag', name: 'Kafka Lag', value: '12 ms', status: 'healthy', icon: 'kafka_lag' },
{ id: 'stream_throughput', name: 'Stream Throughput', value: '142K msg/s', status: 'healthy', icon: 'throughput' },
{ id: 'lakehouse_freshness', name: 'Lakehouse Freshness', value: '2 min', status: 'healthy', icon: 'lakehouse' },
{ id: 'dbt_models', name: 'dbt Models', value: 'All Healthy', status: 'healthy', icon: 'dbt' },
{ id: 'great_expectations', name: 'Great Expectations', value: '99.97%', status: 'healthy', icon: 'great_expectations' }];


export const mockInfrastructure: InfraService[] = [
{ id: 'kafka', name: 'Kafka', status: 'healthy', icon: 'kafka' },
{ id: 'postgresql', name: 'PostgreSQL', status: 'healthy', icon: 'postgresql' },
{ id: 'redis', name: 'Redis', status: 'healthy', icon: 'redis' },
{ id: 'airflow', name: 'Airflow', status: 'healthy', icon: 'airflow' },
{ id: 'duckdb', name: 'DuckDB', status: 'healthy', icon: 'duckdb' }];


export const mockLiveFeedSeed: LiveTransaction[] = [
{ id: 'seed_1', timestamp: '2026-10-05T21:42:17', transactionId: 'TXN_9F34K2Q8LM', region: 'US', amount: 4320, currency: 'USD', riskScore: 12, decision: 'Approved' },
{ id: 'seed_2', timestamp: '2026-10-05T21:42:12', transactionId: 'TXN_9D2B6L8MQ1', region: 'GB', amount: 1250, currency: 'EUR', riskScore: 68, decision: 'Review' },
{ id: 'seed_3', timestamp: '2026-10-05T21:42:08', transactionId: 'TXN_4C7E19SZ0P', region: 'AE', amount: 8760, currency: 'USD', riskScore: 92, decision: 'Declined' },
{ id: 'seed_4', timestamp: '2026-10-05T21:42:03', transactionId: 'TXN_8K1D5V6T3R', region: 'SG', amount: 640, currency: 'USD', riskScore: 23, decision: 'Approved' },
{ id: 'seed_5', timestamp: '2026-10-05T21:41:58', transactionId: 'TXN_2M9Q7H4LX5', region: 'CA', amount: 2180, currency: 'USD', riskScore: 47, decision: 'Review' }];


export const mockNotifications: AppNotification[] = [
{ id: 'n1', title: 'High-risk cluster detected', message: '3 accounts matched impossible travel + device anomaly.', timestamp: '2026-10-05T21:40:00', severity: 'High', read: false },
{ id: 'n2', title: 'Velocity spike in AE', message: 'Card attempts up 4.2× over baseline in the last 15 min.', timestamp: '2026-10-05T21:28:00', severity: 'Medium', read: false },
{ id: 'n3', title: 'dbt run completed', message: 'All 48 models passed tests.', timestamp: '2026-10-05T21:00:00', severity: 'Low', read: true }];


export const mockCurrentUser: UserProfile = {
  id: 'usr_001',
  name: 'Omar Haddad',
  role: 'Fraud Analyst',
  avatarUrl: "/7fcf2c65-96c8-4fd1-93a8-7c7216dec67f.jpg"
};

export const mockSearchIndex: SearchResult[] = [
{ id: 's1', type: 'transaction', title: 'TXN_9F34K2Q8LM', subtitle: 'US · $4,320.00 · Approved' },
{ id: 's2', type: 'transaction', title: 'TXN_4C7E19SZ0P', subtitle: 'AE · $8,760.00 · Declined' },
{ id: 's3', type: 'transaction', title: 'TXN_9D2B6L8MQ1', subtitle: 'GB · €1,250.00 · Review' },
{ id: 's4', type: 'account', title: 'ACC_77120934', subtitle: 'Retail · Risk score 81' },
{ id: 's5', type: 'account', title: 'ACC_10458821', subtitle: 'Business · Risk score 24' },
{ id: 's6', type: 'country', title: 'United Arab Emirates', subtitle: '58 high-risk events today' },
{ id: 's7', type: 'country', title: 'United States', subtitle: '148 high-risk events today' },
{ id: 's8', type: 'country', title: 'Singapore', subtitle: '11 high-risk events today' }];