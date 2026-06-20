/**
 * FinancialScreen — Financial Performance (Axe 1, SIMULATED headline money).
 * Cards: Revenue / Expenses / Profit / Cash / Forecast + MRR / ARR / Gross &
 * Net margin / Growth. Graphs: Revenue vs Expenses, Profit Trend, Revenue by
 * Service & Country, Cost Breakdown, Top Clients. Carries the PROJECTION badge.
 */

import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../lib/useAnalytics';
import {
  ScreenHeader, KpiGrid, Kpi, SectionTitle, ChartGrid, LoadingState, useScope,
} from '../components/analytics';
import {
  ChartCard, LineChart, BarChart, ColoredBarChart, DoughnutChart, monthLabel,
} from '../components/charts';
import {
  revenue, expensesTotal, profit, cashAvailable, forecastRevenue, mrr, arr,
  profitMarginPct, netMarginPct, revenueGrowthPct, revenueVsExpensesByMonth,
  profitByMonth, revenueByService, revenueByCountry, expensesByCategory, topClientsByRevenue,
} from '../lib/kpis';
import { formatDA, formatPct } from '../lib/format';
import { serviceLabel, serviceHex, seriesColor } from '../lib/labels';

export function FinancialScreen() {
  const { t } = useTranslation();
  const { ready, ds } = useAnalytics();
  const scope = useScope();

  if (!ready) return <LoadingState />;

  const revExp = revenueVsExpensesByMonth(ds);
  const prof = profitByMonth(ds);
  const svc = revenueByService(ds);
  const country = revenueByCountry(ds);
  const cost = expensesByCategory(ds);
  const top = topClientsByRevenue(ds, 8);
  const grow = revenueGrowthPct(ds);

  const countryEntries = Object.entries(country).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div>
      <ScreenHeader
        icon="ph-chart-line-up"
        title={t('nav.financial')}
        subtitle={t('analytics.financialSub')}
        scope={scope}
        accent="var(--green-500)"
        projection
      />

      {/* Headline financials */}
      <KpiGrid>
        <Kpi icon="ph-currency-circle-dollar" accent="var(--blue-500)" label={t('kpi.revenue')} value={formatDA(revenue(ds))} delta={`${formatPct(grow)} ${t('kpi.momShort')}`} deltaTone={grow >= 0 ? 'up' : 'down'} projected />
        <Kpi icon="ph-receipt" accent="var(--red-500)" label={t('kpi.expenses')} value={formatDA(expensesTotal(ds))} delta={t('kpi.operating')} deltaTone="flat" projected />
        <Kpi icon="ph-trend-up" accent="var(--green-500)" label={t('kpi.profit')} value={formatDA(profit(ds))} delta={`${formatPct(profitMarginPct(ds))} ${t('kpi.marginShort')}`} deltaTone="up" projected />
        <Kpi icon="ph-wallet" accent="var(--branch-comptabilite)" label={t('kpi.cash')} value={formatDA(cashAvailable(ds))} delta={t('kpi.netPosition')} deltaTone={cashAvailable(ds) >= 0 ? 'up' : 'down'} projected />
        <Kpi icon="ph-crystal-ball" accent="var(--branch-management)" label={t('kpi.forecast')} value={formatDA(forecastRevenue(ds))} delta={t('kpi.weightedPipeline')} deltaTone="flat" projected />
      </KpiGrid>

      <KpiGrid>
        <Kpi icon="ph-repeat" accent="var(--blue-500)" label={t('kpi.mrr')} value={formatDA(mrr(ds))} delta={t('kpi.subscription')} deltaTone="flat" projected />
        <Kpi icon="ph-calendar-check" accent="var(--blue-600)" label={t('kpi.arr')} value={formatDA(arr(ds))} delta={t('kpi.annualRunRate')} deltaTone="flat" projected />
        <Kpi icon="ph-percent" accent="var(--green-500)" label={t('kpi.grossMargin')} value={formatPct(profitMarginPct(ds))} delta={t('kpi.onRevenue')} deltaTone="up" projected />
        <Kpi icon="ph-percent" accent="var(--branch-comptabilite)" label={t('kpi.netMargin')} value={formatPct(netMarginPct(ds))} delta={t('kpi.afterExpenses')} deltaTone={netMarginPct(ds) >= 0 ? 'up' : 'down'} projected />
        <Kpi icon="ph-rocket-launch" accent="var(--orange-500)" label={t('kpi.growth')} value={formatPct(grow)} delta={t('kpi.momShort')} deltaTone={grow >= 0 ? 'up' : 'down'} projected />
      </KpiGrid>

      {/* Graphs */}
      <SectionTitle icon="ph-chart-bar">{t('analytics.revenueAnalysis')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.revenueVsExpenses')} subtitle={t('badge.projection')} accent="var(--orange-500)" empty={revExp.length === 0} span2>
          <BarChart
            labels={revExp.map((r) => monthLabel(r.month))}
            series={[
              { label: t('kpi.revenue'), values: revExp.map((r) => r.revenue), color: '#0074ff' },
              { label: t('kpi.expenses'), values: revExp.map((r) => r.expenses), color: '#f0453e' },
            ]}
          />
        </ChartCard>

        <ChartCard title={t('chart.profitTrend')} empty={prof.length === 0}>
          <LineChart labels={prof.map((p) => monthLabel(p.month))} series={[{ label: t('kpi.profit'), values: prof.map((p) => p.amount), color: '#22c55e', fill: true }]} />
        </ChartCard>

        <ChartCard title={t('chart.revenueByService')} empty={Object.keys(svc).length === 0}>
          <DoughnutChart labels={Object.keys(svc).map(serviceLabel)} values={Object.values(svc)} colors={Object.keys(svc).map(serviceHex)} />
        </ChartCard>
      </ChartGrid>

      <SectionTitle icon="ph-coins">{t('analytics.profitabilityAnalysis')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.revenueByCountry')} empty={countryEntries.length === 0}>
          <ColoredBarChart labels={countryEntries.map((c) => c[0])} values={countryEntries.map((c) => c[1])} colors={countryEntries.map((_, i) => seriesColor(i))} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.costBreakdown')} empty={Object.keys(cost).length === 0}>
          <DoughnutChart labels={Object.keys(cost)} values={Object.values(cost)} />
        </ChartCard>

        <ChartCard title={t('chart.topClients')} empty={top.length === 0} span2>
          <ColoredBarChart labels={top.map((c) => c.name)} values={top.map((c) => c.amount)} colors={top.map((_, i) => seriesColor(i))} horizontal />
        </ChartCard>
      </ChartGrid>
    </div>
  );
}
