import { useStream } from '../contexts/StreamContext';
import { lakehouseApi } from '../utils/lakehouseClient';
import { lakehouseConfig } from '../utils/lakehouseConfig';
import { useLakehouseQuery } from './useLakehouseQuery';
import type { TransactionQuery } from '../types/operations';

const intervals = lakehouseConfig.refreshIntervals;

export function useTransactions(query: TransactionQuery) {
  const paused = !useStream().isLive;
  return useLakehouseQuery(`transactions:${JSON.stringify(query)}`, (s) => lakehouseApi.getTransactions(query, s), {
    refreshInterval: query.page === 1 ? intervals.liveFeed * 2 : undefined,
    paused
  });
}

export function useFraudRules() {
  return useLakehouseQuery('fraudRules', (s) => lakehouseApi.getFraudRules(s));
}

export function useFraudPatternDetails() {
  return useLakehouseQuery('fraudPatternDetails', (s) => lakehouseApi.getFraudPatternDetails(s));
}

export function useAlerts() {
  const paused = !useStream().isLive;
  return useLakehouseQuery('alerts', (s) => lakehouseApi.getAlerts(s), { refreshInterval: intervals.alerts, paused });
}

export function useLakehouseTables() {
  const paused = !useStream().isLive;
  return useLakehouseQuery('lakehouseTables', (s) => lakehouseApi.getLakehouseTables(s), {
    refreshInterval: intervals.lakehouseTables,
    paused
  });
}

export function useSyncJobs() {
  return useLakehouseQuery('syncJobs', (s) => lakehouseApi.getSyncJobs(s), { refreshInterval: intervals.syncJobs });
}

export function useSettings() {
  return useLakehouseQuery('settings', (s) => lakehouseApi.getSettings(s));
}