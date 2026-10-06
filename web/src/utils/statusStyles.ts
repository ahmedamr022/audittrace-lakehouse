import type { Decision, HealthStatus, RegionStatus, RiskLevel, Severity } from '../types/dashboard';

/** Hex values used inside SVG/charts (must match tailwind.config.js tokens). */
export const COLORS = {
  brand100: '#e0f2fe',
  brand200: '#bae6fd',
  brand300: '#7dd3fc',
  brand400: '#38bdf8',
  brand500: '#0ea5e9',
  brand600: '#0284c7',
  brand700: '#0369a1',
  review: '#f5b82e',
  declined: '#f43f5e',
  critical: '#8b5cf6',
  ink: '#0b2540',
  inkMuted: '#4a6178',
  inkSoft: '#8296ab',
  line: '#e2edf5'
};

export const REGION_STATUS_COLOR: Record<RegionStatus, string> = {
  normal: COLORS.brand500,
  review: COLORS.review,
  suspicious: COLORS.declined
};

export const REGION_STATUS_LABEL: Record<RegionStatus, string> = {
  normal: 'Normal',
  review: 'Review',
  suspicious: 'Suspicious'
};

export const DECISION_COLOR: Record<Decision, string> = {
  Approved: COLORS.brand500,
  Review: COLORS.review,
  Declined: COLORS.declined
};

export const DECISION_BADGE: Record<Decision, string> = {
  Approved: 'bg-brand-50 text-brand-700 ring-brand-200',
  Review: 'bg-amber-50 text-amber-700 ring-amber-200',
  Declined: 'bg-rose-50 text-rose-600 ring-rose-200'
};

export const RISK_LEVEL_DOT: Record<RiskLevel, string> = {
  Low: 'bg-brand-500',
  Medium: 'bg-review',
  High: 'bg-declined',
  Critical: 'bg-critical'
};

export const RISK_LEVEL_BAR: Record<RiskLevel, string> = {
  Low: 'brand-bar',
  Medium: 'bg-review',
  High: 'bg-declined',
  Critical: 'bg-critical'
};

export const SEVERITY_BADGE: Record<Severity, string> = {
  Critical: 'bg-violet-50 text-violet-700 ring-violet-200',
  High: 'bg-rose-50 text-rose-600 ring-rose-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Low: 'bg-brand-50 text-brand-700 ring-brand-200'
};

export const SEVERITY_DOT: Record<Severity, string> = {
  Critical: 'bg-critical',
  High: 'bg-declined',
  Medium: 'bg-review',
  Low: 'bg-brand-500'
};

export const HEALTH_DOT: Record<HealthStatus, string> = {
  healthy: 'bg-brand-500',
  degraded: 'bg-review',
  down: 'bg-declined'
};

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down'
};

export function riskScoreClass(score: number): string {
  if (score >= 80) return 'text-rose-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-ink';
}

export function decisionDotClass(decision: Decision): string {
  if (decision === 'Declined') return 'bg-declined';
  if (decision === 'Review') return 'bg-review';
  return 'bg-brand-500';
}

/** Country shading for the choropleth (sky → amber → rose, all soft tints). */
export function countryRiskFill(score: number | undefined): string {
  if (score === undefined) return '#dcecf7';
  if (score >= 80) return '#fda4af';
  if (score >= 65) return '#fecdd3';
  if (score >= 50) return '#fde3a7';
  if (score >= 35) return '#a5d8f5';
  return '#c4e5f8';
}

export const COUNTRY_RISK_SCALE = [
{ label: '< 35', color: '#c4e5f8' },
{ label: '35–49', color: '#a5d8f5' },
{ label: '50–64', color: '#fde3a7' },
{ label: '65–79', color: '#fecdd3' },
{ label: '80+', color: '#fda4af' }];