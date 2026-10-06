import { useStream } from '../contexts/StreamContext';
import { lakehouseApi } from '../utils/lakehouseClient';
import { lakehouseConfig } from '../utils/lakehouseConfig';
import { useLakehouseQuery } from './useLakehouseQuery';
import type { TimeRange } from '../types/dashboard';

const intervals = lakehouseConfig.refreshIntervals;

function usePaused(): boolean {
  return !useStream().isLive;
}

export function useKpis() {
  return useLakehouseQuery('kpis', (s) => lakehouseApi.getKpis(s), { refreshInterval: intervals.kpis, paused: usePaused() });
}

export function useActivity(range: TimeRange) {
  return useLakehouseQuery(`activity:${range}`, (s) => lakehouseApi.getActivity(range, s), {
    refreshInterval: intervals.activity,
    paused: usePaused()
  });
}

export function useFraudRadar() {
  return useLakehouseQuery('fraudRadar', (s) => lakehouseApi.getFraudRadar(s), {
    refreshInterval: intervals.fraudRadar,
    paused: usePaused()
  });
}

export function useRiskDistribution() {
  return useLakehouseQuery('riskDistribution', (s) => lakehouseApi.getRiskDistribution(s), {
    refreshInterval: intervals.riskDistribution,
    paused: usePaused()
  });
}

export function useTransactionDecisions() {
  return useLakehouseQuery('decisions', (s) => lakehouseApi.getTransactionDecisions(s), {
    refreshInterval: intervals.decisions,
    paused: usePaused()
  });
}

export function useRiskMap() {
  return useLakehouseQuery('riskMap', (s) => lakehouseApi.getRiskMap(s), {
    refreshInterval: intervals.riskMap,
    paused: usePaused()
  });
}

export function useFraudPatterns(limit = 5) {
  return useLakehouseQuery(`fraudPatterns:${limit}`, (s) => lakehouseApi.getFraudPatterns(limit, s), {
    refreshInterval: intervals.fraudPatterns,
    paused: usePaused()
  });
}

export function usePipelineHealth() {
  return useLakehouseQuery('pipelineHealth', (s) => lakehouseApi.getPipelineHealth(s), {
    refreshInterval: intervals.pipelineHealth,
    paused: usePaused()
  });
}

export function useLiveFeed(limit = 5) {
  return useLakehouseQuery(`liveFeed:${limit}`, (s) => lakehouseApi.getLiveFeed(limit, s), {
    refreshInterval: intervals.liveFeed,
    paused: usePaused()
  });
}

export function useInfrastructure() {
  return useLakehouseQuery('infrastructure', (s) => lakehouseApi.getInfrastructure(s), {
    refreshInterval: intervals.infrastructure,
    paused: usePaused()
  });
}

export function useStreamStatus() {
  return useLakehouseQuery('streamStatus', (s) => lakehouseApi.getStreamStatus(s), {
    refreshInterval: intervals.streamStatus,
    paused: usePaused()
  });
}

export function useNotifications() {
  return useLakehouseQuery('notifications', (s) => lakehouseApi.getNotifications(s), {
    refreshInterval: intervals.notifications,
    paused: usePaused()
  });
}

export function useCurrentUser() {
  return useLakehouseQuery('currentUser', (s) => lakehouseApi.getCurrentUser(s));
}