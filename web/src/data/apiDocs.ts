export interface ApiDoc {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  returns: string;
  usedBy: string;
}

export const apiDocs: ApiDoc[] = [
{ method: 'GET', path: '/api/v1/metrics/kpis', returns: 'KpiMetric[]', usedBy: 'Overview · KPI cards' },
{ method: 'GET', path: '/api/v1/transactions/activity?range=24H', returns: 'ActivitySeries', usedBy: 'Overview · Activity chart' },
{ method: 'GET', path: '/api/v1/fraud/radar', returns: 'FraudRadar', usedBy: 'Overview · Fraud Risk Radar' },
{ method: 'GET', path: '/api/v1/risk/distribution', returns: 'RiskDistributionItem[]', usedBy: 'Overview · Risk Distribution' },
{ method: 'GET', path: '/api/v1/transactions/decisions', returns: 'TransactionDecisionSummary', usedBy: 'Overview · Transaction Decision' },
{ method: 'GET', path: '/api/v1/risk/geo', returns: 'RiskMapData', usedBy: 'Overview map · Geo Risk' },
{ method: 'GET', path: '/api/v1/fraud/patterns?limit=5', returns: 'FraudPattern[]', usedBy: 'Overview · Top Fraud Patterns' },
{ method: 'GET', path: '/api/v1/fraud/patterns/details', returns: 'FraudPatternDetail[]', usedBy: 'Fraud Patterns' },
{ method: 'GET', path: '/api/v1/pipeline/health', returns: 'PipelineMetric[]', usedBy: 'Overview · Lakehouse' },
{ method: 'GET', path: '/api/v1/transactions/live?limit=5', returns: 'LiveTransaction[]', usedBy: 'Overview · Live feed' },
{ method: 'GET', path: '/api/v1/transactions?q=&decision=&region=&page=&pageSize=', returns: 'TransactionPage', usedBy: 'Transactions' },
{ method: 'GET', path: '/api/v1/infrastructure/status', returns: 'InfraService[]', usedBy: 'Overview · Lakehouse' },
{ method: 'GET', path: '/api/v1/stream/status', returns: 'StreamStatus', usedBy: 'Live Stream control' },
{ method: 'GET', path: '/api/v1/notifications', returns: 'AppNotification[]', usedBy: 'Bell menu' },
{ method: 'POST', path: '/api/v1/notifications/read-all', returns: '204', usedBy: 'Bell menu' },
{ method: 'GET', path: '/api/v1/me', returns: 'UserProfile', usedBy: 'Top bar' },
{ method: 'GET', path: '/api/v1/search?q=', returns: 'SearchResult[]', usedBy: 'Global search' },
{ method: 'POST', path: '/api/v1/auth/logout', returns: '204', usedBy: 'Sign out' },
{ method: 'GET', path: '/api/v1/fraud/rules', returns: 'FraudRule[]', usedBy: 'Fraud Rules' },
{ method: 'POST', path: '/api/v1/fraud/rules', returns: 'FraudRule', usedBy: 'Fraud Rules · New rule' },
{ method: 'PATCH', path: '/api/v1/fraud/rules/:id', returns: 'FraudRule', usedBy: 'Fraud Rules · toggle/threshold/action' },
{ method: 'DELETE', path: '/api/v1/fraud/rules/:id', returns: '204', usedBy: 'Fraud Rules · delete' },
{ method: 'GET', path: '/api/v1/alerts', returns: 'RiskAlertItem[]', usedBy: 'Alerts' },
{ method: 'PATCH', path: '/api/v1/alerts/:id', returns: 'RiskAlertItem', usedBy: 'Alerts · acknowledge/resolve' },
{ method: 'GET', path: '/api/v1/lakehouse/tables', returns: 'LakehouseTable[]', usedBy: 'Data Lakehouse' },
{ method: 'POST', path: '/api/v1/lakehouse/tables/:id/refresh', returns: 'LakehouseTable', usedBy: 'Data Lakehouse · refresh' },
{ method: 'GET', path: '/api/v1/sync/jobs', returns: 'SyncJob[]', usedBy: 'Cloud Sync' },
{ method: 'POST', path: '/api/v1/sync/jobs/:id/run', returns: 'SyncJob', usedBy: 'Cloud Sync · run now' },
{ method: 'PATCH', path: '/api/v1/sync/jobs/:id', returns: 'SyncJob', usedBy: 'Cloud Sync · schedule toggle' },
{ method: 'GET', path: '/api/v1/settings', returns: 'AppSettings', usedBy: 'Settings' },
{ method: 'PUT', path: '/api/v1/settings', returns: 'AppSettings', usedBy: 'Settings · save' }];