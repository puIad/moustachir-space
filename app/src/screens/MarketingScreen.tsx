/**
 * MarketingScreen — Marketing Performance (Axe 2 acquisition REAL; spend/ROAS
 * SIMULATED). Cards: Leads / Qualified / Spend / CPL / ROAS. Graphs: Acquisition
 * Funnel, Leads by Source/Country/Industry, ROAS by Campaign, CPL Trend.
 * Mixed provenance ⇒ PROJECTION badge on the screen; real cards stay unmarked.
 */

import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../lib/useAnalytics';
import {
  ScreenHeader, KpiGrid, Kpi, SectionTitle, ChartGrid, LoadingState, useScope,
} from '../components/analytics';
import {
  ChartCard, LineChart, ColoredBarChart, DoughnutChart, FunnelChart, monthLabel,
} from '../components/charts';
import {
  totalLeads, qualifiedLeads, marketingSpend, cpl, roas, cac, marketingRevenue,
  acquisitionFunnel, leadsByChannel, leadsByCountry, leadsByIndustry, roasByCampaign, cplByMonth,
} from '../lib/kpis';
import { formatDA, formatNumber, formatPct } from '../lib/format';
import { channelLabel, seriesColor } from '../lib/labels';

const FUNNEL_COLORS = ['#8b5cf6', '#0ea5e9', '#0074ff', '#f59e0b', '#1fb255'];

export function MarketingScreen() {
  const { t } = useTranslation();
  const { ready, ds } = useAnalytics();
  const scope = useScope();

  if (!ready) return <LoadingState />;

  const funnel = acquisitionFunnel(ds);
  const bySource = leadsByChannel(ds);
  const byCountry = leadsByCountry(ds);
  const byIndustry = leadsByIndustry(ds);
  const roasCamp = roasByCampaign(ds);
  const cplTrend = cplByMonth(ds);

  const countryEntries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const industryEntries = Object.entries(byIndustry).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const qualPct = totalLeads(ds) > 0 ? (qualifiedLeads(ds) / totalLeads(ds)) * 100 : 0;

  return (
    <div>
      <ScreenHeader
        icon="ph-megaphone"
        title={t('nav.marketing')}
        subtitle={t('analytics.marketingSub')}
        scope={scope}
        accent="var(--branch-communication)"
        projection
      />

      <KpiGrid>
        <Kpi icon="ph-magnet" accent="var(--branch-communication)" label={t('kpi.leads')} value={formatNumber(totalLeads(ds))} delta={t('badge.real')} deltaTone="flat" />
        <Kpi icon="ph-funnel" accent="var(--blue-500)" label={t('kpi.qualified')} value={formatNumber(qualifiedLeads(ds))} delta={`${formatPct(qualPct)} ${t('kpi.ofLeads')}`} deltaTone="up" projected />
        <Kpi icon="ph-money" accent="var(--red-500)" label={t('kpi.spend')} value={formatDA(marketingSpend(ds))} delta={t('kpi.adBudget')} deltaTone="flat" projected />
        <Kpi icon="ph-tag" accent="var(--orange-500)" label={t('kpi.cpl')} value={formatDA(cpl(ds))} delta={`${t('kpi.cac')} ${formatDA(cac(ds))}`} deltaTone="flat" projected />
        <Kpi icon="ph-chart-line-up" accent="var(--green-500)" label={t('kpi.roas')} value={`${formatNumber(roas(ds))}×`} delta={`${formatDA(marketingRevenue(ds))} ${t('kpi.attributed')}`} deltaTone="up" projected />
      </KpiGrid>

      <SectionTitle icon="ph-funnel-simple">{t('analytics.acquisition')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.acquisitionFunnel')} subtitle={t('badge.projection')} accent="var(--orange-500)" empty={funnel.every((f) => f.value === 0)} span2>
          <FunnelChart stages={funnel.map((f, i) => ({ label: t(`funnel.${f.key}`), value: f.value, color: FUNNEL_COLORS[i] }))} />
        </ChartCard>

        <ChartCard title={t('chart.leadsBySource')} subtitle={t('badge.real')} accent="var(--green-500)" empty={Object.keys(bySource).length === 0}>
          <DoughnutChart labels={Object.keys(bySource).map(channelLabel)} values={Object.values(bySource)} money={false} />
        </ChartCard>

        <ChartCard title={t('chart.cplTrend')} empty={cplTrend.length === 0}>
          <LineChart labels={cplTrend.map((c) => monthLabel(c.month))} series={[{ label: t('kpi.cpl'), values: cplTrend.map((c) => c.cpl), color: '#f5781f', fill: true }]} />
        </ChartCard>
      </ChartGrid>

      <SectionTitle icon="ph-users">{t('analytics.audienceCampaign')}</SectionTitle>
      <ChartGrid>
        <ChartCard title={t('chart.leadsByCountry')} empty={countryEntries.length === 0}>
          <ColoredBarChart labels={countryEntries.map((c) => c[0])} values={countryEntries.map((c) => c[1])} colors={countryEntries.map((_, i) => seriesColor(i))} money={false} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.leadsByIndustry')} empty={industryEntries.length === 0}>
          <ColoredBarChart labels={industryEntries.map((c) => c[0])} values={industryEntries.map((c) => c[1])} colors={industryEntries.map((_, i) => seriesColor(i))} money={false} horizontal />
        </ChartCard>

        <ChartCard title={t('chart.roasByCampaign')} empty={roasCamp.length === 0} span2>
          <ColoredBarChart labels={roasCamp.map((c) => c.name)} values={roasCamp.map((c) => c.roas)} colors={roasCamp.map((_, i) => seriesColor(i))} money={false} />
        </ChartCard>
      </ChartGrid>
    </div>
  );
}
