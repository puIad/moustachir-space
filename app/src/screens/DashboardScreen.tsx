/**
 * DashboardScreen — executive overview (Group-1 / Axe synthesis).
 * KPI cards + six graphs + strategic intelligence + branch comparison, all
 * driven by lib/kpis.ts over the filter-scoped Dataset (lib/useAnalytics).
 * Headline money is SIMULATED ⇒ the screen carries the PROJECTION badge.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../lib/useAnalytics';
import {
  ScreenHeader, KpiGrid, Kpi, SectionTitle, ChartGrid, InsightCard, LoadingState, useScope,
} from '../components/analytics';
import { Button } from '../design-system';
import { generateShareholderDeck } from '../lib/deck';
import {
  ChartCard, LineChart, ColoredBarChart, DoughnutChart, FunnelChart, monthLabel,
} from '../components/charts';
import {
  revenue, profit, profitMarginPct, activeClients, totalLeads, openOpportunities,
  activeProjects, satisfactionScore, revenueGrowthPct, uniqueClients,
  revenueByMonth, revenueByService, profitByService, globalFunnel, clientGrowthByMonth,
  serviceRanking, revenueByBranch, winRate, churnRiskClients, revenueBySalesperson,
} from '../lib/kpis';
import { formatDA, formatNumber, formatPct } from '../lib/format';
import { branchLabel, branchHex, serviceLabel, serviceHex, NAV_BRANCHES } from '../lib/labels';
import type { BranchKey } from '@spec/entities';

const FUNNEL_COLORS = ['#0074ff', '#3a8bff', '#0ea5e9', '#f59e0b', '#1fb255'];

function topEntry(rec: Record<string, number>): [string, number] | null {
  const e = Object.entries(rec);
  if (e.length === 0) return null;
  return e.reduce((a, b) => (b[1] > a[1] ? b : a));
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const { ready, ds, dsAllBranches, filters } = useAnalytics();
  const scope = useScope();

  const handleGenerateDeck = () => {
    const getChartImage = (id: string): string | null => {
      const canvas = document.getElementById(id) as HTMLCanvasElement | null;
      return canvas ? canvas.toDataURL('image/png') : null;
    };

    const chartImages = {
      revenueTrend: getChartImage('chart-revenue-trend'),
      revenueService: getChartImage('chart-revenue-service'),
      profitService: getChartImage('chart-profit-service'),
      globalFunnel: getChartImage('chart-global-funnel'),
      clientGrowth: getChartImage('chart-client-growth'),
      serviceRanking: getChartImage('chart-service-ranking'),
      revenueBranch: getChartImage('chart-revenue-branch'),
    };

    generateShareholderDeck(ds, filters, chartImages, t);
  };

  const branchRows = useMemo(() => {
    const rev = revenueByBranch(dsAllBranches);
    return NAV_BRANCHES.map((key) => {
      const sales = dsAllBranches.sales.filter((s) => s.branchKey === key);
      return {
        key,
        revenue: rev[key] ?? 0,
        profit: sales.reduce((a, s) => a + s.margin, 0),
        clients: dsAllBranches.clients.filter((c) => c.branchKey === key).length,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [dsAllBranches]);

  if (!ready) return <LoadingState />;

  const rev = revenueByMonth(ds);
  const svc = revenueByService(ds);
  const profSvc = profitByService(ds);
  const funnel = globalFunnel(ds);
  const growth = clientGrowthByMonth(ds);
  const ranking = serviceRanking(ds);

  const bestBranch = branchRows[0];
  const bestSales = topEntry(revenueBySalesperson(ds));
  const churn = churnRiskClients(ds);
  const win = winRate(ds);
  const grow = revenueGrowthPct(ds);

  return (
    <div>
      <ScreenHeader
        icon="ph-chart-pie-slice"
        title={t('nav.dashboard')}
        subtitle={t('analytics.dashboardSub')}
        scope={scope}
        accent="var(--blue-500)"
        projection
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateDeck}
            leadingIcon={<i className="ph ph-presentation-chart" style={{ fontSize: 16 }} />}
          >
            {t('deck.generate') || 'Générer le deck'}
          </Button>
        }
      />

      {/* Executive KPI cards */}
      <KpiGrid>
        <Kpi icon="ph-currency-circle-dollar" accent="var(--blue-500)" label={t('kpi.revenue')} value={formatDA(revenue(ds))} delta={`${formatPct(grow)} ${t('kpi.momShort')}`} deltaTone={grow >= 0 ? 'up' : 'down'} projected />
        <Kpi icon="ph-trend-up" accent="var(--green-500)" label={t('kpi.profit')} value={formatDA(profit(ds))} delta={`${formatPct(profitMarginPct(ds))} ${t('kpi.marginShort')}`} deltaTone="up" projected />
        <Kpi icon="ph-users-three" accent="var(--branch-consulting)" label={t('kpi.activeClients')} value={formatNumber(activeClients(ds))} delta={`${formatNumber(uniqueClients(ds))} ${t('kpi.totalShort')}`} deltaTone="flat" />
        <Kpi icon="ph-user-plus" accent="var(--branch-academy)" label={t('kpi.newClients')} value={formatNumber(uniqueClients(ds))} delta={t('kpi.inScope')} deltaTone="flat" />
        <Kpi icon="ph-magnet" accent="var(--branch-communication)" label={t('kpi.leads')} value={formatNumber(totalLeads(ds))} delta={t('badge.real')} deltaTone="flat" />
        <Kpi icon="ph-target" accent="var(--orange-500)" label={t('kpi.opportunities')} value={formatNumber(openOpportunities(ds))} delta={`${formatPct(win)} ${t('kpi.winShort')}`} deltaTone="up" projected />
        <Kpi icon="ph-kanban" accent="var(--branch-management)" label={t('kpi.activeProjects')} value={formatNumber(activeProjects(ds))} delta={t('kpi.inProgress')} deltaTone="flat" projected />
        <Kpi icon="ph-smiley" accent="var(--amber-500)" label={t('kpi.satisfaction')} value={formatPct(satisfactionScore(ds))} delta={t('kpi.csatBased')} deltaTone="up" projected />
      </KpiGrid>

      {/* Graphs */}
      <SectionTitle icon="ph-chart-line">{t('analytics.graphs')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.revenueTrend')} subtitle={t('badge.projection')} accent="var(--orange-500)" empty={rev.length === 0} span2>
          <LineChart id="chart-revenue-trend" labels={rev.map((r) => monthLabel(r.month))} series={[{ label: t('kpi.revenue'), values: rev.map((r) => r.amount), color: '#0074ff', fill: true }]} />
        </ChartCard>

        <ChartCard title={t('chart.revenueByService')} empty={Object.keys(svc).length === 0}>
          <DoughnutChart id="chart-revenue-service" labels={Object.keys(svc).map(serviceLabel)} values={Object.values(svc)} colors={Object.keys(svc).map(serviceHex)} />
        </ChartCard>

        <ChartCard title={t('chart.profitByService')} empty={Object.keys(profSvc).length === 0}>
          <ColoredBarChart id="chart-profit-service" labels={Object.keys(profSvc).map(serviceLabel)} values={Object.values(profSvc)} colors={Object.keys(profSvc).map(serviceHex)} />
        </ChartCard>

        <ChartCard title={t('chart.globalFunnel')} empty={funnel.every((f) => f.value === 0)}>
          <FunnelChart id="chart-global-funnel" stages={funnel.map((f, i) => ({ label: t(`funnel.${f.key}`), value: f.value, color: FUNNEL_COLORS[i] }))} />
        </ChartCard>

        <ChartCard title={t('chart.clientGrowth')} subtitle={t('badge.real')} accent="var(--green-500)" empty={growth.length === 0}>
          <LineChart id="chart-client-growth" labels={growth.map((g) => monthLabel(g.month))} series={[{ label: t('kpi.totalShort'), values: growth.map((g) => g.total), color: '#22c55e', fill: true }]} money={false} />
        </ChartCard>

        <ChartCard title={t('chart.serviceRanking')} empty={ranking.length === 0} span2>
          <ColoredBarChart id="chart-service-ranking" labels={ranking.map((r) => serviceLabel(r.service))} values={ranking.map((r) => r.amount)} colors={ranking.map((r) => serviceHex(r.service))} horizontal />
        </ChartCard>
      </ChartGrid>

      {/* Strategic intelligence */}
      <SectionTitle icon="ph-brain">{t('analytics.strategic')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {bestBranch && (
          <InsightCard tone="positive" title={t('insight.bestBranchTitle')}>
            {t('insight.bestBranch', { branch: branchLabel(bestBranch.key), value: formatDA(bestBranch.revenue) })}
          </InsightCard>
        )}
        {bestSales && (
          <InsightCard tone="neutral" title={t('insight.topSalesTitle')}>
            {t('insight.topSales', { name: bestSales[0], value: formatDA(bestSales[1]) })}
          </InsightCard>
        )}
        <InsightCard tone={churn > 0 ? 'warning' : 'positive'} title={t('insight.churnTitle')}>
          {t('insight.churn', { count: churn })}
        </InsightCard>
        <InsightCard tone={win >= 50 ? 'positive' : 'warning'} title={t('insight.winTitle')}>
          {t('insight.win', { rate: formatPct(win) })}
        </InsightCard>
      </div>

      {/* Branch comparison */}
      <SectionTitle icon="ph-git-diff">{t('analytics.branchCompare')}</SectionTitle>
      <ChartGrid min={420}>
        <ChartCard title={t('chart.revenueByBranch')} empty={branchRows.every((b) => b.revenue === 0)}>
          <ColoredBarChart id="chart-revenue-branch" labels={branchRows.map((b) => branchLabel(b.key))} values={branchRows.map((b) => b.revenue)} colors={branchRows.map((b) => branchHex(b.key))} horizontal />
        </ChartCard>
        <ChartCard title={t('chart.branchTable')} height={260}>
          <BranchTable rows={branchRows} />
        </ChartCard>
      </ChartGrid>
    </div>
  );
}

function BranchTable({ rows }: { rows: Array<{ key: BranchKey; revenue: number; profit: number; clients: number }> }) {
  const { t } = useTranslation();
  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', font: 'var(--fw-medium) var(--fs-sm)/1 var(--font-text)' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--ink-400)', font: 'var(--fw-bold) var(--fs-micro)/1 var(--font-text)', textTransform: 'uppercase', letterSpacing: 'var(--ls-caps)' }}>
            <th style={{ padding: '8px 6px' }}>{t('filters.branch')}</th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('kpi.revenue')}</th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('kpi.profit')}</th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('kpi.clientsShort')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} style={{ borderTop: '1px solid var(--line-100)' }}>
              <td style={{ padding: '9px 6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: branchHex(r.key) }} />
                  {branchLabel(r.key)}
                </span>
              </td>
              <td className="ms-mono" style={{ padding: '9px 6px', textAlign: 'right', color: 'var(--ink-900)', fontWeight: 700 }}>{formatDA(r.revenue)}</td>
              <td className="ms-mono" style={{ padding: '9px 6px', textAlign: 'right', color: 'var(--green-500)', fontWeight: 700 }}>{formatDA(r.profit)}</td>
              <td className="ms-mono" style={{ padding: '9px 6px', textAlign: 'right', color: 'var(--ink-700)' }}>{formatNumber(r.clients)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
