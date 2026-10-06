import type React from 'react';
import {
  ChartNoAxesColumnIncreasingIcon,
  CreditCardIcon,
  DatabaseIcon,
  GaugeIcon,
  PlaneTakeoffIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SignalIcon,
  SmartphoneIcon,
  UserXIcon,
  WaypointsIcon,
  ZapIcon } from
'lucide-react';
import { SiApacheairflow, SiApachekafka, SiDbt, SiPostgresql, SiRedis } from 'react-icons/si';
import type { InfraIcon, KpiId, PipelineIcon, SignalIcon as SignalIconKey } from '../../types/dashboard';

type IconComponent = React.ComponentType<{className?: string;'aria-hidden'?: boolean;}>;

export const KPI_ICONS: Record<KpiId, IconComponent> = {
  total_transactions: ChartNoAxesColumnIncreasingIcon,
  fraud_risk: ShieldIcon,
  blocked_value: DatabaseIcon,
  avg_processing: ZapIcon,
  data_quality: DatabaseIcon
};

export const SIGNAL_ICONS: Record<SignalIconKey, IconComponent> = {
  impossible_travel: PlaneTakeoffIcon,
  velocity_spike: WaypointsIcon,
  device_anomaly: SmartphoneIcon,
  card_testing: CreditCardIcon,
  account_takeover: UserXIcon
};

export const PIPELINE_ICONS: Record<PipelineIcon, IconComponent> = {
  kafka_lag: SignalIcon,
  throughput: GaugeIcon,
  lakehouse: DatabaseIcon,
  dbt: SiDbt,
  great_expectations: ShieldCheckIcon
};

export const INFRA_ICONS: Record<InfraIcon, IconComponent> = {
  kafka: SiApachekafka,
  postgresql: SiPostgresql,
  redis: SiRedis,
  airflow: SiApacheairflow,
  duckdb: ChartNoAxesColumnIncreasingIcon
};