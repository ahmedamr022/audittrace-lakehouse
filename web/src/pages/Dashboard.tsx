import React from 'react';
import { brand } from '../data/brand';
import { StreamControl } from '../components/layout/StreamControl';
import { PageTitle } from '../components/ui/PageTitle';
import { KpiStrip } from '../components/dashboard/KpiStrip';
import { TransactionActivity } from '../components/dashboard/TransactionActivity';
import { FraudRiskRadar } from '../components/dashboard/FraudRiskRadar';
import { RiskDistribution } from '../components/dashboard/RiskDistribution';
import { TransactionDecision } from '../components/dashboard/TransactionDecision';
import { RiskMapCard } from '../components/dashboard/RiskMapCard';
import { TopFraudPatterns } from '../components/dashboard/TopFraudPatterns';
import { PipelineHealth } from '../components/dashboard/PipelineHealth';
import { LiveTransactionFeed } from '../components/dashboard/LiveTransactionFeed';
import { LocalInfrastructure } from '../components/dashboard/LocalInfrastructure';

export function Dashboard() {
  return (
    <>
      <PageTitle title={brand.name} subtitle={brand.tagline} actions={<StreamControl />} />

      <div className="mt-4">
        <KpiStrip />
      </div>

      {/* Left: activity → map → feed | Right: (radar, patterns) + (distribution, decision, pipeline), then infrastructure */}
      <div className="mt-3.5 grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,2.3fr)_minmax(0,2.42fr)]">
        <div className="flex min-w-0 flex-col gap-3.5">
          <TransactionActivity />
          <RiskMapCard />
          <LiveTransactionFeed className="flex-1" />
        </div>

        <div className="flex min-w-0 flex-col gap-3.5">
          <div className="grid flex-1 grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3.5">
              <FraudRiskRadar />
              <TopFraudPatterns className="flex-1" />
            </div>
            <div className="flex min-w-0 flex-col gap-3.5">
              <RiskDistribution />
              <TransactionDecision />
              <PipelineHealth className="flex-1" />
            </div>
          </div>
          <LocalInfrastructure />
        </div>
      </div>
    </>);

}