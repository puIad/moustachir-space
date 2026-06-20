/**
 * CommercialScreen — Commercial Performance (Axe: pipeline/opportunities,
 * SIMULATED). Cards: Pipeline / Opportunities / Proposals / Won / Lost.
 * KPIs: Win Rate, Lead→Customer, Proposal Acceptance, Avg Deal Size, Sales Cycle,
 * Revenue/Salesperson. Sections: Sales Funnel + Team Performance (per-salesperson
 * table with All / last-month / last-week timeline selector) + Opportunity
 * (lost/winning reasons). Graphs: Funnel, Pipeline Distribution, Revenue by
 * Salesperson, Proposal Acceptance Trend, Lost Reasons, Sales Cycle Trend.
 * Fully simulated provenance ⇒ PROJECTION badge.
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '../design-system';
import { useAnalytics } from '../lib/useAnalytics';
import {
  ScreenHeader, KpiGrid, Kpi, SectionTitle, ChartGrid, InsightCard, LoadingState, useScope,
} from '../components/analytics';
import {
  ChartCard, LineChart, ColoredBarChart, DoughnutChart, FunnelChart, monthLabel,
} from '../components/charts';
import {
  pipelineValue, openOpportunities, proposalsCount, wonCount, lostCount,
  winRate, leadToCustomerRate, proposalAcceptanceRate, avgDealSize, salesCycleDays,
  revenue, salesmenCount, globalFunnel, opportunitiesByStage, salespersonPerformance,
  proposalAcceptanceByMonth, lostReasons, wonReasons, salesCycleByMonth, applyTimeWindow,
  type TimeWindow,
} from '../lib/kpis';
import { formatDA, formatNumber, formatPct } from '../lib/format';
import { seriesColor } from '../lib/labels';

const FUNNEL_COLORS = ['#8b5cf6', '#0ea5e9', '#0074ff', '#f59e0b', '#1fb255'];

export function CommercialScreen() {
  const { t } = useTranslation();
  const { ready, ds } = useAnalytics();
  const scope = useScope();
  const [win, setWin] = useState<TimeWindow>('all');

  const team = useMemo(
    () => (ready ? salespersonPerformance(applyTimeWindow(ds, win)) : []),
    [ready, ds, win],
  );

  if (!ready) return <LoadingState />;

  const funnel = globalFunnel(ds);
  const pipeline = opportunitiesByStage(ds);
  const perf = salespersonPerformance(ds);
  const acceptTrend = proposalAcceptanceByMonth(ds);
  const lost = lostReasons(ds);
  const won = wonReasons(ds);
  const cycleTrend = salesCycleByMonth(ds);
  const revPerSales = salesmenCount(ds) > 0 ? revenue(ds) / salesmenCount(ds) : 0;
  const topSeller = perf[0];

  return (
    <div>
      <ScreenHeader
        icon="ph-handshake"
        title={t('nav.commercial')}
        subtitle={t('analytics.commercialSub')}
        scope={scope}
        accent="var(--branch-consulting)"
        projection
      />

      <KpiGrid>
        <Kpi icon="ph-funnel" accent="var(--branch-consulting)" label={t('kpi.pipelineValue')} value={formatDA(pipelineValue(ds))} delta={t('kpi.weightedPipeline')} deltaTone="flat" projected />
        <Kpi icon="ph-target" accent="var(--blue-500)" label={t('kpi.opportunities')} value={formatNumber(openOpportunities(ds))} delta={t('kpi.openOpps')} deltaTone="flat" projected />
        <Kpi icon="ph-file-text" accent="var(--violet-500)" label={t('kpi.proposals')} value={formatNumber(proposalsCount(ds))} delta={`${formatPct(proposalAcceptanceRate(ds))} ${t('kpi.proposalAccept')}`} deltaTone="up" projected />
        <Kpi icon="ph-trophy" accent="var(--green-500)" label={t('kpi.won')} value={formatNumber(wonCount(ds))} delta={`${formatPct(winRate(ds))} ${t('kpi.winShort')}`} deltaTone="up" projected />
        <Kpi icon="ph-x-circle" accent="var(--red-500)" label={t('kpi.lost')} value={formatNumber(lostCount(ds))} delta={t('kpi.lost')} deltaTone="down" projected />
      </KpiGrid>

      <KpiGrid>
        <Kpi icon="ph-percent" accent="var(--green-500)" label={t('kpi.winRate')} value={formatPct(winRate(ds))} delta={t('kpi.winShort')} deltaTone="up" projected />
        <Kpi icon="ph-user-switch" accent="var(--blue-500)" label={t('kpi.leadToCustomer')} value={formatPct(leadToCustomerRate(ds))} delta={t('kpi.ofLeads')} deltaTone="up" projected />
        <Kpi icon="ph-check-square" accent="var(--violet-500)" label={t('kpi.proposalAccept')} value={formatPct(proposalAcceptanceRate(ds))} delta={t('kpi.proposals')} deltaTone="up" projected />
        <Kpi icon="ph-coins" accent="var(--orange-500)" label={t('kpi.avgDeal')} value={formatDA(avgDealSize(ds))} delta={t('kpi.totalShort')} deltaTone="flat" projected />
        <Kpi icon="ph-clock-countdown" accent="var(--branch-consulting)" label={t('kpi.salesCycle')} value={`${formatNumber(salesCycleDays(ds))} ${t('kpi.days')}`} delta={t('kpi.salesCycle')} deltaTone="flat" projected />
        <Kpi icon="ph-user-circle-gear" accent="var(--green-500)" label={t('kpi.revPerSales')} value={formatDA(revPerSales)} delta={t('kpi.revPerSales')} deltaTone="flat" projected />
      </KpiGrid>

      <SectionTitle icon="ph-funnel-simple">{t('analytics.pipeline')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.salesFunnel')} subtitle={t('badge.projection')} accent="var(--branch-consulting)" empty={funnel.every((f) => f.value === 0)} span2>
          <FunnelChart stages={funnel.map((f, i) => ({ label: t(`funnel.${f.key}`), value: f.value, color: FUNNEL_COLORS[i] }))} />
        </ChartCard>

        <ChartCard title={t('chart.pipelineDistribution')} empty={Object.keys(pipeline).length === 0}>
          <DoughnutChart labels={Object.keys(pipeline)} values={Object.values(pipeline)} money={false} />
        </ChartCard>

        <ChartCard title={t('chart.revenueBySalesperson')} empty={perf.length === 0} span2>
          <ColoredBarChart labels={perf.map((p) => p.name)} values={perf.map((p) => p.revenue)} colors={perf.map((_, i) => seriesColor(i))} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.salesCycleTrend')} empty={cycleTrend.length === 0}>
          <LineChart labels={cycleTrend.map((c) => monthLabel(c.month))} series={[{ label: t('kpi.salesCycle'), values: cycleTrend.map((c) => c.days), color: '#0074ff', fill: true }]} money={false} />
        </ChartCard>
      </ChartGrid>

      <SectionTitle
        icon="ph-users-three"
        hint={topSeller ? t('insight.topSales', { name: topSeller.name, value: formatDA(topSeller.revenue) }) : undefined}
      >
        {t('analytics.teamPerformance')}
      </SectionTitle>
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <SegmentedControl
          options={[
            { label: t('team.windowAll'), value: 'all' },
            { label: t('team.windowMonth'), value: 'month' },
            { label: t('team.windowWeek'), value: 'week' },
          ]}
          value={win}
          onChange={(v) => setWin(v as TimeWindow)}
          style={{ maxWidth: 380 }}
        />
      </div>
      <TeamTable rows={team} />

      <SectionTitle icon="ph-scales">{t('analytics.opportunityAnalysis')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.winningReasons')} accent="var(--green-500)" empty={Object.keys(won).length === 0}>
          <ColoredBarChart labels={Object.keys(won)} values={Object.values(won)} colors={Object.keys(won).map((_, i) => seriesColor(i))} money={false} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.lostReasons')} accent="var(--red-500)" empty={Object.keys(lost).length === 0}>
          <ColoredBarChart labels={Object.keys(lost)} values={Object.values(lost)} colors={Object.keys(lost).map(() => '#ef4444')} money={false} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.proposalAcceptanceTrend')} empty={acceptTrend.length === 0} span2>
          <LineChart labels={acceptTrend.map((a) => monthLabel(a.month))} series={[{ label: t('kpi.proposalAccept'), values: acceptTrend.map((a) => a.rate), color: '#8b5cf6', fill: true }]} money={false} />
        </ChartCard>
      </ChartGrid>

      <SectionTitle icon="ph-lightbulb">{t('analytics.strategic')}</SectionTitle>
      <ChartGrid min={300}>
        <InsightCard tone="positive" title={t('insight.winTitle')}>
          {t('insight.win', { rate: formatPct(winRate(ds)) })}
        </InsightCard>
        {topSeller && (
          <InsightCard tone="neutral" title={t('insight.topSalesTitle')}>
            {t('insight.topSales', { name: topSeller.name, value: formatDA(topSeller.revenue) })}
          </InsightCard>
        )}
      </ChartGrid>
    </div>
  );
}

function TeamTable({ rows }: { rows: ReturnType<typeof salespersonPerformance> }) {
  const { t } = useTranslation();
  const cell: React.CSSProperties = { padding: '10px 14px', font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)', color: 'var(--ink-700)', textAlign: 'right', whiteSpace: 'nowrap' };
  const head: React.CSSProperties = { ...cell, font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-text)', color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--line-100)' };

  if (rows.length === 0) {
    return (
      <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-400)', background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', marginBottom: 'var(--space-6)', font: 'var(--fw-medium) var(--fs-sm)/1.4 var(--font-text)' }}>
        {t('team.noRows')}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', background: 'var(--surface-card)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', marginBottom: 'var(--space-6)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
        <thead>
          <tr>
            <th style={{ ...head, textAlign: 'left' }}>{t('team.salesperson')}</th>
            <th style={head}>{t('team.revenue')}</th>
            <th style={head}>{t('team.deals')}</th>
            <th style={head}>{t('team.won')}</th>
            <th style={head}>{t('team.lost')}</th>
            <th style={head}>{t('team.winRate')}</th>
            <th style={head}>{t('team.avgDeal')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--line-50)' }}>
              <td style={{ ...cell, textAlign: 'left', font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-text)', color: 'var(--ink-900)' }}>{r.name}</td>
              <td style={{ ...cell, font: 'var(--fw-semibold) var(--fs-sm)/1 var(--font-mono)' }}>{formatDA(r.revenue)}</td>
              <td style={cell}>{formatNumber(r.deals)}</td>
              <td style={{ ...cell, color: 'var(--green-500)' }}>{formatNumber(r.won)}</td>
              <td style={{ ...cell, color: 'var(--red-500)' }}>{formatNumber(r.lost)}</td>
              <td style={cell}>{formatPct(r.winRate)}</td>
              <td style={{ ...cell, font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-mono)' }}>{formatDA(r.avgDeal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
