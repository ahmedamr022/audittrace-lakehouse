/** MOCK DATA for operational pages — used only while lakehouseConfig.mode === 'mock'. */
import type { CountryRisk } from '../types/dashboard';
import type {
  AppSettings,
  FraudPatternDetail,
  FraudRule,
  LakehouseTable,
  RiskAlertItem,
  SyncJob } from
'../types/operations';

export const mockCountryRisk: CountryRisk[] = [
{ id: '840', name: 'United States', iso2: 'US', riskScore: 78, transactionCount: 812000, highRiskCount: 132, regionId: 'north_america' },
{ id: '124', name: 'Canada', iso2: 'CA', riskScore: 41, transactionCount: 74000, highRiskCount: 11, regionId: 'north_america' },
{ id: '484', name: 'Mexico', iso2: 'MX', riskScore: 57, transactionCount: 26000, highRiskCount: 5, regionId: 'north_america' },
{ id: '076', name: 'Brazil', iso2: 'BR', riskScore: 34, transactionCount: 118000, highRiskCount: 6, regionId: 'south_america' },
{ id: '032', name: 'Argentina', iso2: 'AR', riskScore: 22, transactionCount: 44000, highRiskCount: 3, regionId: 'south_america' },
{ id: '826', name: 'United Kingdom', iso2: 'GB', riskScore: 52, transactionCount: 236000, highRiskCount: 28, regionId: 'europe' },
{ id: '276', name: 'Germany', iso2: 'DE', riskScore: 38, transactionCount: 198000, highRiskCount: 17, regionId: 'europe' },
{ id: '250', name: 'France', iso2: 'FR', riskScore: 45, transactionCount: 162000, highRiskCount: 19, regionId: 'europe' },
{ id: '643', name: 'Russia', iso2: 'RU', riskScore: 69, transactionCount: 88000, highRiskCount: 8, regionId: 'europe' },
{ id: '784', name: 'United Arab Emirates', iso2: 'AE', riskScore: 88, transactionCount: 132000, highRiskCount: 41, regionId: 'middle_east' },
{ id: '682', name: 'Saudi Arabia', iso2: 'SA', riskScore: 63, transactionCount: 82000, highRiskCount: 17, regionId: 'middle_east' },
{ id: '792', name: 'Türkiye', iso2: 'TR', riskScore: 48, transactionCount: 39000, highRiskCount: 4, regionId: 'europe' },
{ id: '156', name: 'China', iso2: 'CN', riskScore: 81, transactionCount: 402000, highRiskCount: 74, regionId: 'asia' },
{ id: '356', name: 'India', iso2: 'IN', riskScore: 59, transactionCount: 214000, highRiskCount: 31, regionId: 'asia' },
{ id: '392', name: 'Japan', iso2: 'JP', riskScore: 27, transactionCount: 74000, highRiskCount: 6, regionId: 'asia' },
{ id: '702', name: 'Singapore', iso2: 'SG', riskScore: 31, transactionCount: 41000, highRiskCount: 10, regionId: 'asia' },
{ id: '566', name: 'Nigeria', iso2: 'NG', riskScore: 44, transactionCount: 23000, highRiskCount: 3, regionId: 'africa' },
{ id: '710', name: 'South Africa', iso2: 'ZA', riskScore: 29, transactionCount: 31000, highRiskCount: 2, regionId: 'africa' },
{ id: '818', name: 'Egypt', iso2: 'EG', riskScore: 36, transactionCount: 17000, highRiskCount: 1, regionId: 'africa' },
{ id: '036', name: 'Australia', iso2: 'AU', riskScore: 19, transactionCount: 66000, highRiskCount: 6, regionId: 'australia' }];


export const mockFraudRules: FraudRule[] = [
{ id: 'rule_1', name: 'Geo-velocity breach', description: 'Two card-present transactions > 800 km apart within 1 hour.', pattern: 'impossible_travel', threshold: 75, action: 'Decline', enabled: true, hits24h: 1284, updatedAt: '2026-10-04T10:12:00' },
{ id: 'rule_2', name: 'Burst authorization attempts', description: 'More than 8 authorizations from the same card within 5 minutes.', pattern: 'velocity_spike', threshold: 65, action: 'Review', enabled: true, hits24h: 962, updatedAt: '2026-10-03T16:40:00' },
{ id: 'rule_3', name: 'Micro-charge probing', description: 'Sequence of sub-$2 charges across distinct merchants.', pattern: 'card_testing', threshold: 70, action: 'Decline', enabled: true, hits24h: 731, updatedAt: '2026-10-02T09:05:00' },
{ id: 'rule_4', name: 'New device + high amount', description: 'First-seen device fingerprint with amount above 3× customer median.', pattern: 'device_mismatch', threshold: 60, action: 'Review', enabled: true, hits24h: 518, updatedAt: '2026-09-30T13:22:00' },
{ id: 'rule_5', name: 'Credential reset then payout', description: 'Password or phone change followed by payout within 30 minutes.', pattern: 'account_takeover', threshold: 80, action: 'Decline', enabled: false, hits24h: 0, updatedAt: '2026-09-28T18:47:00' }];


export const mockAlerts: RiskAlertItem[] = [
{ id: 'al_1', title: 'Coordinated impossible-travel cluster', message: '3 accounts transacted from Dubai and New York within 22 minutes.', severity: 'Critical', status: 'open', timestamp: '2026-10-05T21:40:00', region: 'AE', pattern: 'Impossible Travel', accountsAffected: 3, amountAtRisk: 26280, currency: 'USD' },
{ id: 'al_2', title: 'Velocity spike on BIN 431940', message: 'Authorization attempts up 4.2× baseline in the last 15 minutes.', severity: 'High', status: 'open', timestamp: '2026-10-05T21:28:00', region: 'GB', pattern: 'Velocity Spike', accountsAffected: 41, amountAtRisk: 18450, currency: 'GBP' },
{ id: 'al_3', title: 'Card testing from single ASN', message: '182 micro-charges routed through AS20473.', severity: 'High', status: 'acknowledged', timestamp: '2026-10-05T20:52:00', region: 'US', pattern: 'Card Testing', accountsAffected: 182, amountAtRisk: 3640, currency: 'USD' },
{ id: 'al_4', title: 'Emulator device fingerprints', message: '12 sessions with identical emulator signature attempted payouts.', severity: 'Medium', status: 'open', timestamp: '2026-10-05T20:11:00', region: 'SG', pattern: 'Device Mismatch', accountsAffected: 12, amountAtRisk: 9120, currency: 'SGD' },
{ id: 'al_5', title: 'Payout after credential reset', message: 'Phone number changed 6 minutes before a $4,900 payout.', severity: 'High', status: 'resolved', timestamp: '2026-10-05T18:34:00', region: 'CA', pattern: 'Account Takeover', accountsAffected: 1, amountAtRisk: 4900, currency: 'CAD' },
{ id: 'al_6', title: 'Unusual merchant category mix', message: 'Gift-card merchants spiking for retail segment in SA.', severity: 'Medium', status: 'acknowledged', timestamp: '2026-10-05T17:02:00', region: 'SA', pattern: 'Velocity Spike', accountsAffected: 27, amountAtRisk: 11200, currency: 'SAR' },
{ id: 'al_7', title: 'Model drift warning', message: 'Feature distribution shift detected for amount_zscore.', severity: 'Low', status: 'open', timestamp: '2026-10-05T15:20:00', region: 'Global', pattern: 'Model Health', accountsAffected: 0, amountAtRisk: 0, currency: 'USD' }];


export const mockLakehouseTables: LakehouseTable[] = [
{ id: 't1', name: 'bronze.raw_card_authorizations', layer: 'bronze', rowCount: 418_220_118, sizeBytes: 812_000_000_000, lastUpdated: '2026-10-05T21:41:00', qualityScore: 99.4, status: 'healthy' },
{ id: 't2', name: 'bronze.raw_device_events', layer: 'bronze', rowCount: 1_204_551_902, sizeBytes: 1_420_000_000_000, lastUpdated: '2026-10-05T21:40:00', qualityScore: 98.7, status: 'healthy' },
{ id: 't3', name: 'silver.transactions_stream', layer: 'silver', rowCount: 96_118_430, sizeBytes: 142_000_000_000, lastUpdated: '2026-10-05T21:41:30', qualityScore: 99.9, status: 'healthy' },
{ id: 't4', name: 'silver.customer_profiles', layer: 'silver', rowCount: 8_441_002, sizeBytes: 9_800_000_000, lastUpdated: '2026-10-05T21:15:00', qualityScore: 99.6, status: 'healthy' },
{ id: 't5', name: 'silver.device_fingerprints', layer: 'silver', rowCount: 22_718_440, sizeBytes: 18_200_000_000, lastUpdated: '2026-10-05T20:58:00', qualityScore: 97.2, status: 'degraded' },
{ id: 't6', name: 'gold.fct_transactions', layer: 'gold', rowCount: 96_002_115, sizeBytes: 64_000_000_000, lastUpdated: '2026-10-05T21:39:00', qualityScore: 99.97, status: 'healthy' },
{ id: 't7', name: 'gold.agg_risk_by_region', layer: 'gold', rowCount: 14_880, sizeBytes: 22_000_000, lastUpdated: '2026-10-05T21:40:00', qualityScore: 100, status: 'healthy' },
{ id: 't8', name: 'gold.agg_fraud_patterns', layer: 'gold', rowCount: 3_120, sizeBytes: 4_100_000, lastUpdated: '2026-10-05T21:38:00', qualityScore: 100, status: 'healthy' },
{ id: 't9', name: 'gold.risk_alerts', layer: 'gold', rowCount: 48_214, sizeBytes: 61_000_000, lastUpdated: '2026-10-05T21:40:30', qualityScore: 99.8, status: 'healthy' }];


export const mockSyncJobs: SyncJob[] = [
{ id: 'sync_1', name: 'Gold → S3 archive', destination: 's3://fraud-lakehouse/gold', schedule: 'Every 15 min', enabled: true, status: 'success', lastRunAt: '2026-10-05T21:30:00', rowsSynced: 1_284_002 },
{ id: 'sync_2', name: 'Alerts → Case management', destination: 'Salesforce Service Cloud', schedule: 'Every 5 min', enabled: true, status: 'success', lastRunAt: '2026-10-05T21:40:00', rowsSynced: 214 },
{ id: 'sync_3', name: 'KPIs → Executive BI', destination: 'Power BI workspace', schedule: 'Hourly', enabled: true, status: 'failed', lastRunAt: '2026-10-05T21:00:00', rowsSynced: 0 },
{ id: 'sync_4', name: 'Model features → Feature store', destination: 'Feast online store', schedule: 'Every 1 min', enabled: false, status: 'idle', lastRunAt: '2026-10-04T08:12:00', rowsSynced: 9_420_118 }];


export const mockSettings: AppSettings = {
  defaultRange: '24H',
  liveOnLoad: true,
  reviewThreshold: 40,
  declineThreshold: 80,
  emailAlerts: true,
  slackAlerts: true,
  smsAlerts: false,
  alertMinSeverity: 'Medium'
};

export const mockPatternDetails: FraudPatternDetail[] = [
{ id: 'impossible_travel', name: 'Impossible Travel', percent: 32.4, cases: 1284, changePercent: 6.2, trend: [62, 70, 68, 75, 81, 79, 88, 92, 90, 98, 104, 112], description: 'The same card or account transacts from locations that are physically impossible to travel between in the elapsed time.', topRegions: ['AE', 'US', 'CN'] },
{ id: 'velocity_spike', name: 'Velocity Spike', percent: 24.7, cases: 962, changePercent: 3.8, trend: [50, 54, 52, 60, 58, 66, 70, 68, 74, 72, 79, 84], description: 'An unusually high number of authorization attempts in a short window, often from automated scripts.', topRegions: ['GB', 'SA', 'IN'] },
{ id: 'card_testing', name: 'Card Testing', percent: 18.9, cases: 731, changePercent: -2.1, trend: [80, 78, 74, 76, 70, 68, 66, 69, 64, 62, 63, 60], description: 'Small-value charges used to validate stolen card numbers before larger fraudulent purchases.', topRegions: ['US', 'BR', 'NG'] },
{ id: 'device_mismatch', name: 'Device Mismatch', percent: 13.6, cases: 518, changePercent: 1.4, trend: [40, 42, 41, 44, 46, 45, 48, 47, 50, 49, 52, 53], description: 'Transactions from a device fingerprint never associated with the customer, or from emulators.', topRegions: ['SG', 'DE', 'FR'] },
{ id: 'account_takeover', name: 'Account Takeover', percent: 10.4, cases: 402, changePercent: -0.6, trend: [36, 38, 35, 37, 39, 36, 38, 37, 35, 36, 35, 34], description: 'Credential or contact details change shortly before high-value payouts or transfers.', topRegions: ['CA', 'GB', 'AU'] }];


export const regionOptions = ['US', 'GB', 'AE', 'SG', 'CA', 'DE', 'SA', 'IN', 'AU', 'JP', 'FR', 'BR'];